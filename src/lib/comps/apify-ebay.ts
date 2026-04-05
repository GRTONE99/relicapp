// src/lib/comps/apify-ebay.ts
//
// Shared types for the eBay comps system.
// Used on the client to type-check responses from the ebay-comps Edge Function.
// No secrets, no API calls — safe to import anywhere in the frontend.

// ─── Input ────────────────────────────────────────────────────────────────────

export interface CompsInput {
  /** Primary item name / description, e.g. "Wayne Gretzky Rookie Card" */
  title: string;
  player?: string;
  team?: string;
  year?: string;
  /** Matches CollectionItem.category slugs, e.g. "cards", "autographs" */
  category?: string;
  /** PSA, JSA, Beckett, etc. */
  authentication_company?: string;
  /** Numeric grade string, e.g. "7", "9.5" */
  grade?: string;
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface EbayComp {
  title: string;
  soldPrice: number;
  currency: string;
  /** ISO date string, e.g. "2024-03-15" */
  soldDate: string;
  listingUrl: string;
  /** eBay item ID used for deduplication */
  externalId: string;
}

export interface CompsSummary {
  /** Number of comps after filtering */
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  /** Recent comps weighted higher; best single estimate for the item */
  weightedEstimate: number;
  /** 0–100 confidence in the estimate */
  confidence: number;
}

export interface CompsResponse {
  /** The eBay search query that was used */
  query: string;
  summary: CompsSummary;
  comps: EbayComp[];
}

// ─── Error shape ──────────────────────────────────────────────────────────────

export interface CompsError {
  success: false;
  error: string;
}

export type CompsResult = ({ success: true } & CompsResponse) | CompsError;
