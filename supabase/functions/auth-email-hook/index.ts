// This hook has been intentionally disabled.
// Returning 501 causes Supabase Auth to fall back to its native SMTP
// (Resend), which sends the branded template set in the dashboard.
Deno.serve(() =>
  new Response(JSON.stringify({ error: "Hook disabled — using native SMTP" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  })
);
