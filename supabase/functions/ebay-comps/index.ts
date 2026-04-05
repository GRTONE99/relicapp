// supabase/functions/ebay-comps/index.ts
//
// Supabase Edge Function — server-side only.
// Accepts item fields, builds a smart eBay search query, calls Apify's
// caffein.dev~ebay-sold-listings actor synchronously, filters and normalizes
// the results, and returns structured comps + summary metrics.
//
// APIFY_API_TOKEN must be set as a Supabase secret:
//   supabase secrets set APIFY_API_TOKEN=apify_api_XXXX

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompsInput {
  title: string;
  player?: string;
  team?: string;
  year?: string;
  category?: string;
  authentication_company?: string;
  grade?: string;
}

interface EbayComp {
  title: string;
  soldPrice: number;
  currency: string;
  soldDate: string;
  listingUrl: string;
  externalId: string;
}

interface CompsSummary {
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  weightedEstimate: number;
  confidence: number;
}

interface CompsResponse {
  query: string;
  summary: CompsSummary;
  comps: EbayComp[];
}

// Raw item shape returned by the Apify actor. Field names vary across actor
// versions so we try multiple known aliases in the normalizer below.
// deno-lint-ignore no-explicit-any
type ApifyRawItem = Record<string, any>;

// ─── Keyword builder ──────────────────────────────────────────────────────────

/**
 * Use the item name as the eBay search query directly.
 * The item name is already the most accurate description of what the collector
 * has and produces the most relevant sold comps.
 */
function buildSearchQuery(input: CompsInput): string {
  return input.title.trim();
}

// ─── Price parser ─────────────────────────────────────────────────────────────

/**
 * Parse a price value from multiple possible raw representations:
 *   - number primitive:        123.45
 *   - string with symbols:     "$1,234.56"
 *   - object with value key:   { value: 123.45, currency: "USD" }
 *   - object with amount key:  { amount: "123.45" }
 *
 * Returns null if the value cannot be parsed to a positive number.
 */
function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === "number") {
    return raw > 0 ? raw : null;
  }

  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return n > 0 ? n : null;
  }

  if (typeof raw === "object") {
    // Try common nested shapes
    const obj = raw as Record<string, unknown>;
    return (
      parsePrice(obj["value"]) ??
      parsePrice(obj["amount"]) ??
      parsePrice(obj["price"]) ??
      null
    );
  }

  return null;
}

// ─── Raw item normalizer ──────────────────────────────────────────────────────

/**
 * Convert a raw Apify actor item into a clean EbayComp.
 * Returns null if required fields (price, URL) cannot be extracted.
 *
 * Field aliases handled:
 *   title:     title | name | heading
 *   price:     price | soldPrice | PRICE | finalPrice | lastPrice
 *   currency:  currency | CURRENCY | price.currency
 *   soldDate:  soldDate | dateSold | endDate | closedDate | date
 *   url:       url | link | itemUrl | listingUrl
 *   id:        itemId | id | externalId | ebayItemId
 */
function normalizeItem(raw: ApifyRawItem, idx: number): EbayComp | null {
  const title: string =
    raw["title"] ?? raw["name"] ?? raw["heading"] ?? "";

  const rawPrice =
    raw["price"] ??
    raw["soldPrice"] ??
    raw["PRICE"] ??
    raw["finalPrice"] ??
    raw["lastPrice"] ??
    null;
  const soldPrice = parsePrice(rawPrice);
  if (!soldPrice) return null; // price is mandatory

  // Currency: try direct field, then nested in price object
  const rawCurrency =
    raw["currency"] ??
    raw["CURRENCY"] ??
    (typeof raw["price"] === "object" ? (raw["price"] as Record<string, unknown>)["currency"] : null) ??
    "USD";
  const currency = String(rawCurrency).toUpperCase() || "USD";

  // Sold date: normalize to ISO date string (YYYY-MM-DD)
  const rawDate =
    raw["soldDate"] ??
    raw["dateSold"] ??
    raw["endDate"] ??
    raw["closedDate"] ??
    raw["date"] ??
    "";
  const soldDate = normalizeDateString(String(rawDate));

  // Listing URL
  const listingUrl: string =
    raw["url"] ??
    raw["link"] ??
    raw["itemUrl"] ??
    raw["listingUrl"] ??
    "";
  if (!listingUrl) return null; // URL is mandatory for provenance

  // External ID for deduplication
  const externalId: string = String(
    raw["itemId"] ??
    raw["id"] ??
    raw["externalId"] ??
    raw["ebayItemId"] ??
    // Fall back to extracting the item ID from the URL
    extractEbayItemIdFromUrl(listingUrl) ??
    `apify-${idx}`
  );

  return { title, soldPrice, currency, soldDate, listingUrl, externalId };
}

/** Parse eBay item ID from URL, e.g. /itm/123456789 → "123456789" */
function extractEbayItemIdFromUrl(url: string): string | null {
  const match = url.match(/\/itm\/(\d+)/);
  return match ? match[1] : null;
}

/** Normalize various date string formats to YYYY-MM-DD */
function normalizeDateString(raw: string): string {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toISOString().split("T")[0];
  } catch {
    return raw;
  }
}

// ─── Relevance filter ─────────────────────────────────────────────────────────

// Terms in a listing title that indicate it is NOT a genuine single sold item
const EXCLUSION_TERMS = [
  "reprint",
  "replica",
  "custom",
  " lot ",
  "bundle",
  "reproduction",
  "facsimile",
  "proxy",
];

// Auth-related terms required when searching for authenticated/signed items
const AUTH_TERMS = [
  "signed",
  "autograph",
  "auto",
  "jsa",
  "psa",
  "beckett",
  "bas",
  "coa",
  "authenticated",
];

/**
 * Return true if this comp should be included in the results.
 *
 * Rules applied:
 * 1. Exclude titles containing junk terms (reprint, replica, lot, bundle, etc.)
 * 2. If player is provided, the listing title must contain the player's last name
 * 3. For authenticated/signed item searches, the listing must contain auth terms
 */
function isRelevant(comp: EbayComp, input: CompsInput): boolean {
  const titleLower = comp.title.toLowerCase();

  // Rule 1: junk term exclusion
  for (const term of EXCLUSION_TERMS) {
    // " lot " with spaces to avoid matching "pilot" or "slotted" etc.
    if (titleLower.includes(term)) return false;
  }

  // Rule 2: player name check
  if (input.player) {
    const lastName = input.player.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
    if (lastName.length > 2 && !titleLower.includes(lastName)) return false;
  }

  // Rule 3: auth terms required for signed/authenticated searches.
  // Also detect auth intent directly from the item title — if the collector's
  // own item name contains "autographed", "signed", etc., comps must match.
  const inputTitleLower = input.title.toLowerCase();
  const titleImpliesAuth = AUTH_TERMS.some((t) => inputTitleLower.includes(t));
  const isAuthSearch =
    !!input.authentication_company ||
    (input.category ?? "").toLowerCase() === "autographs" ||
    titleImpliesAuth;

  if (isAuthSearch) {
    const hasAuthTerm = AUTH_TERMS.some((t) => titleLower.includes(t));
    if (!hasAuthTerm) return false;
  }

  return true;
}

// ─── Metrics helpers ──────────────────────────────────────────────────────────

/** Standard median — sorts input so pass a copy if the original order matters */
function computeMedian(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Weighted estimate — recent comps contribute more to the estimate.
 *
 * Weight formula: linear decay over 180 days.
 *   weight = max(0.1, (180 - ageDays) / 180)
 *
 * A comp from today has weight ≈ 1.0; a comp from 6 months ago has weight ≈ 0.1.
 * Comps older than 180 days get the minimum weight (0.1) rather than being excluded.
 */
function computeWeightedEstimate(comps: EbayComp[]): number {
  if (comps.length === 0) return 0;

  const now = Date.now();
  let weightedSum = 0;
  let weightSum = 0;

  for (const comp of comps) {
    const ms = comp.soldDate ? now - new Date(comp.soldDate).getTime() : 0;
    const ageDays = Math.max(0, ms / (1000 * 60 * 60 * 24));
    const weight = Math.max(0.1, (180 - ageDays) / 180);
    weightedSum += comp.soldPrice * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? Math.round((weightedSum / weightSum) * 100) / 100 : 0;
}

/**
 * Confidence score 0–100.
 *
 * Composed of three sub-scores:
 *   countScore    (0–40): more comps = more confidence
 *   similarityScore (0–30): how well comp titles match the search query
 *   recencyScore  (0–30): how recently the comps sold
 */
function computeConfidence(comps: EbayComp[], query: string): number {
  if (comps.length === 0) return 0;

  // Count score (0–40)
  const countScore =
    comps.length >= 8 ? 40 :
    comps.length >= 5 ? 30 :
    comps.length >= 3 ? 20 :
    comps.length >= 1 ? 10 : 0;

  // Similarity score (0–30): average word-overlap between query and comp titles
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  let totalOverlap = 0;
  for (const comp of comps) {
    const compWords = new Set(comp.title.toLowerCase().split(/\s+/));
    let matches = 0;
    for (const word of queryWords) {
      if (compWords.has(word)) matches++;
    }
    totalOverlap += queryWords.size > 0 ? matches / queryWords.size : 0;
  }
  const avgOverlap = totalOverlap / comps.length;
  const similarityScore = Math.round(avgOverlap * 30);

  // Recency score (0–30): based on the oldest comp in the set
  const now = Date.now();
  const ages = comps
    .filter((c) => c.soldDate)
    .map((c) => (now - new Date(c.soldDate).getTime()) / (1000 * 60 * 60 * 24));
  const maxAgeDays = ages.length > 0 ? Math.max(...ages) : 999;
  const recencyScore =
    maxAgeDays <= 30  ? 30 :
    maxAgeDays <= 90  ? 20 :
    maxAgeDays <= 180 ? 10 : 5;

  return Math.min(100, countScore + similarityScore + recencyScore);
}

/** Compute the full summary object from a filtered list of comps */
function computeSummary(
  comps: EbayComp[],
  query: string,
): CompsSummary {
  if (comps.length === 0) {
    return { count: 0, average: 0, median: 0, min: 0, max: 0, weightedEstimate: 0, confidence: 0 };
  }

  const prices = comps.map((c) => c.soldPrice);
  const sum = prices.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / prices.length) * 100) / 100;

  return {
    count: comps.length,
    average,
    median: computeMedian(prices),
    min: Math.min(...prices),
    max: Math.max(...prices),
    weightedEstimate: computeWeightedEstimate(comps),
    confidence: computeConfidence(comps, query),
  };
}

// ─── Apify caller ─────────────────────────────────────────────────────────────

const APIFY_ACTOR = "caffein.dev~ebay-sold-listings";
const APIFY_RUN_SYNC_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`;

// Maximum listings to request from Apify. We fetch a little more than needed
// so the filter step has enough to work with after removing poor matches.
const MAX_ITEMS = 25;

/**
 * Call the Apify actor synchronously and return raw dataset items.
 * Throws on HTTP error or network failure.
 */
async function fetchApifyComps(
  apiToken: string,
  query: string,
): Promise<ApifyRawItem[]> {
  const response = await fetch(`${APIFY_RUN_SYNC_URL}?token=${apiToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Input schema for caffein.dev~ebay-sold-listings.
      // The actor requires the "keyword" field (singular string).
      keyword: query,
      maxItems: MAX_ITEMS,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify error ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();

  // run-sync-get-dataset-items returns the array directly
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected Apify response shape: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return data as ApifyRawItem[];
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    if (!APIFY_API_TOKEN) {
      throw new Error("APIFY_API_TOKEN is not configured. Set it via: supabase secrets set APIFY_API_TOKEN=...");
    }

    // Parse and validate input
    const body = await req.json() as Partial<CompsInput>;
    if (!body.title?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const input: CompsInput = {
      title: body.title.trim(),
      player: body.player?.trim(),
      team: body.team?.trim(),
      year: body.year?.trim(),
      category: body.category?.trim(),
      authentication_company: body.authentication_company?.trim(),
      grade: body.grade?.trim(),
    };

    const query = buildSearchQuery(input);
    console.log(`[ebay-comps] query="${query}"`);

    // Fetch raw results from Apify
    const rawItems = await fetchApifyComps(APIFY_API_TOKEN, query);
    console.log(`[ebay-comps] raw items received: ${rawItems.length}`);

    // Normalize → filter → compute
    const normalized: EbayComp[] = rawItems
      .map((item, idx) => normalizeItem(item, idx))
      .filter((comp): comp is EbayComp => comp !== null);

    const comps: EbayComp[] = normalized.filter((comp) => isRelevant(comp, input));
    console.log(`[ebay-comps] after filtering: ${comps.length} / ${normalized.length}`);

    const summary = computeSummary(comps, query);

    const result: CompsResponse = { query, summary, comps };

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[ebay-comps] error:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
