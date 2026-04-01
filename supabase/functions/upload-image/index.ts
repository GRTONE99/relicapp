import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const enc = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(data: ArrayBuffer | string): Promise<string> {
  const buf = typeof data === "string" ? enc.encode(data) : data;
  return hex(await crypto.subtle.digest("SHA-256", buf));
}

async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(data));
}

async function signedHeaders(
  method: string,
  url: URL,
  body: ArrayBuffer,
  accessKeyId: string,
  secretAccessKey: string,
): Promise<Headers> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const datetime = now.toISOString().replace(/[:\-]|\.\d+/g, "").slice(0, 15) + "Z";
  const bodyHash = await sha256(body);

  const canonicalHeaders = `content-type:image/jpeg\nhost:${url.hostname}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${datetime}\n`;
  const signedHdrs = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [method, url.pathname, "", canonicalHeaders, signedHdrs, bodyHash].join("\n");
  const credentialScope = `${date}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", datetime, credentialScope, await sha256(canonicalRequest)].join("\n");

  let sigKey: ArrayBuffer = enc.encode(`AWS4${secretAccessKey}`);
  sigKey = await hmac(sigKey, date);
  sigKey = await hmac(sigKey, "auto");
  sigKey = await hmac(sigKey, "s3");
  sigKey = await hmac(sigKey, "aws4_request");

  const signature = hex(await hmac(sigKey, stringToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHdrs}, Signature=${signature}`;

  const headers = new Headers();
  headers.set("Content-Type", "image/jpeg");
  headers.set("x-amz-content-sha256", bodyHash);
  headers.set("x-amz-date", datetime);
  headers.set("Authorization", authorization);
  return headers;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL");

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      throw new Error("R2 configuration is incomplete");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) throw new Error("file is required");
    if (!userId) throw new Error("userId is required");

    const fileName = `${userId}/${crypto.randomUUID()}.jpg`;
    const body = await file.arrayBuffer();
    const uploadUrl = new URL(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileName}`);

    console.log("Uploading to:", uploadUrl.toString());
    console.log("Key ID prefix:", R2_ACCESS_KEY_ID.slice(0, 8));
    console.log("Secret length:", R2_SECRET_ACCESS_KEY.length);

    const headers = await signedHeaders("PUT", uploadUrl, body, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY);

    const response = await fetch(uploadUrl.toString(), { method: "PUT", headers, body });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("R2 response headers:", JSON.stringify(Object.fromEntries(response.headers)));
      throw new Error(`R2 upload failed (${response.status}): ${errorText.slice(0, 300)}`);
    }

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${fileName}`;

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("upload-image error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
