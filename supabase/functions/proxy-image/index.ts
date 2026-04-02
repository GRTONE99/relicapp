import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

// Allow both R2 and Supabase Storage — items uploaded before the R2
// migration are stored at *.supabase.co/storage/…
const ALLOWED_HOSTS = ["r2.dev", "supabase.co", "googleusercontent.com", "githubusercontent.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing url parameter", { status: 400, headers: CORS });
  }

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return new Response("Invalid url", { status: 400, headers: CORS });
  }

  if (!ALLOWED_HOSTS.some((h) => parsed.hostname.endsWith(h))) {
    return new Response("URL not allowed", { status: 403, headers: CORS });
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return new Response(`Upstream error: ${res.status}`, { status: res.status, headers: CORS });
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        ...CORS,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new Response(`Proxy error: ${(err as Error).message}`, { status: 500, headers: CORS });
  }
});
