import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function validateUrl(url: string, fallbackQuery: string): Promise<string> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.ok || res.status === 405 || res.status === 403) return url; // 405/403 = exists but blocks HEAD
  } catch { /* broken */ }
  return `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a Bitcoin signal curator for a mindfulness app called Holzen. Your job is to surface ONE real, high-signal piece of Bitcoin analysis or insight that is contextually relevant to the current market conditions.

You MUST call the "return_signal" function with your response. Do not respond with plain text.

Rules:
- Reference REAL analysts, publications, data dashboards, or research from the Bitcoin ecosystem
- VARIETY IS CRITICAL: Each response must use a DIFFERENT source. Draw from the full breadth of Bitcoin analysis — on-chain analysts, macro researchers, mining experts, protocol developers, academic papers, data platforms, newsletters, podcasts, etc. Surprise the reader with lesser-known but credible voices, not just the most popular names.
- The insight should be FACTUAL — a real concept, framework, or historical pattern, not made-up content
- Match it to the current market context (if fees are high, talk about fee markets; if there's a crash, reference historical recoveries; if sentiment is extreme, reference behavioral patterns)
- Keep the body to 2-3 sentences max
- Include a real, working URL to a relevant source (blog post, article, or data dashboard)
- Tone: calm, educational, grounding. No hype, no advice, no predictions.
- Prioritize timeless insights over breaking news`;

    const userPrompt = context
      ? `Current market context: ${context}\n\nFind one relevant, real Bitcoin insight for this moment.`
      : "Find one relevant, real Bitcoin insight for the current moment.";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_signal",
                description: "Return a curated Bitcoin signal/insight.",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Short headline (5-12 words). Factual, not clickbait.",
                    },
                    body: {
                      type: "string",
                      description: "2-3 sentence insight. Reference real data, analysts, or historical patterns.",
                    },
                    source: {
                      type: "string",
                      description: "Name of the source (e.g., 'Lyn Alden', 'mempool.space', 'Glassnode')",
                    },
                    url: {
                      type: "string",
                      description: "A real, working URL to the source material.",
                    },
                  },
                  required: ["title", "body", "source", "url"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_signal" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("Signal AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No signal returned from AI");
    }

    const signal = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(signal), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signal-companion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
