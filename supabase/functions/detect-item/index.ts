import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callOpenAI(apiKey: string, body: unknown, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status !== 429) return response;

    const retryAfter = response.headers.get("retry-after");
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
    console.warn(`Rate limited. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})`);
    await new Promise((res) => setTimeout(res, waitMs));
  }

  // Final attempt — return whatever we get
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 is required");

    const systemPrompt = `You are a sports memorabilia and collectibles identification expert. Analyze the image and extract as much information as possible about the item shown.

You MUST respond by calling the extract_item_info function with the detected information. If you cannot determine a field, leave it as an empty string. For prices, use 0 if unknown.

Guidelines:
- For cards: identify the player, team, year, card brand/set, condition estimate, and any visible grading info
- For jerseys/apparel: identify player, team, size, authenticity markers
- For autographed items: note the authentication company if visible (PSA, JSA, Beckett)
- For graded items: read the grade, grading company, and certification number from the slab/label
- Category must be one of: cards, jerseys-apparel, balls-pucks, equipment, footwear, autographs, photos-posters, tickets-programs, championship-items, game-used, documents, promotional
- Sport must be one of: baseball, basketball, boxing, football, golf, hockey, mma, motorsports, soccer, tennis
- Grading company must be one of: psa, bgs, sgc (lowercase) or empty`;

    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this sports collectible item and extract all details you can see." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_item_info",
            description: "Extract structured information about a sports collectible item from an image",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Full item name/description" },
                player: { type: "string", description: "Player name" },
                team: { type: "string", description: "Team name" },
                year: { type: "string", description: "Year of the item" },
                sport: { type: "string", description: "Sport (lowercase)" },
                category: { type: "string", description: "Item category" },
                condition: { type: "string", description: "Estimated condition" },
                gradingCompany: { type: "string", description: "Grading company (psa, bgs, sgc)" },
                grade: { type: "string", description: "Grade value" },
                certificationNumber: { type: "string", description: "Certification number" },
                authenticationCompany: { type: "string", description: "Authentication company" },
                estimatedValue: { type: "number", description: "Estimated value in USD" },
                notes: { type: "string", description: "Additional details about the item" },
              },
              required: ["name"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_item_info" } },
    };

    const response = await callOpenAI(OPENAI_API_KEY, requestBody);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      const userMessage = `OpenAI API error (${response.status}): ${errorText.slice(0, 300)}`;
      return new Response(JSON.stringify({ success: false, error: userMessage }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const itemInfo = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, item: itemInfo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-item error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
