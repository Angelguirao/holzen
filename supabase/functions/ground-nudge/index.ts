import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function validateUrl(url: string, fallbackQuery: string): Promise<string> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.ok || res.status === 405 || res.status === 403) return url;
  } catch { /* broken */ }
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(fallbackQuery)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a behavioral finance researcher. Given the current market context, generate ONE grounding nudge for a Bitcoin holder who might be about to make an impulsive decision.

Your nudge MUST:
1. Reference a REAL, specific study, paper, or finding from behavioral science, behavioral economics, or finance
2. VARIETY IS CRITICAL: Draw from the full breadth of behavioral science research — not just the most famous names. Include lesser-known but credible researchers, recent papers, cross-disciplinary findings (neuroscience, psychology, sociology), and diverse academic traditions. Surprise the reader.
3. Include the actual researcher names and year (e.g., "Kahneman & Tversky, 1979")
4. Include a citation URL — use the actual DOI link, Google Scholar link, or a reputable source URL for the research
5. Be grounded in fact, not motivational fluff
6. Be concise — 2-3 sentences max for the body

Topics to draw from based on context:
- During crashes/fear: loss aversion, panic selling data, recovery statistics, hot-state decision making, recency bias
- During surges/greed: disposition effect, overconfidence, FOMO neuroscience, herding behavior, narrative fallacy
- General: anchoring, sunk cost, status quo bias, regret aversion, emotional regulation timing`;

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
            {
              role: "user",
              content: `Market context: ${context || "Bitcoin market, general conditions"}. Generate one grounding nudge.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_nudge",
                description:
                  "Return a single behavioral science grounding nudge with a citation.",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description:
                        "Short title summarizing the bias or finding (e.g. 'Loss aversion amplifies drops 2×')",
                    },
                    body: {
                      type: "string",
                      description:
                        "2-3 sentence explanation referencing the specific study, researchers, and year.",
                    },
                    citation: {
                      type: "string",
                      description:
                        "Formatted citation like 'Kahneman & Tversky (1979), Prospect Theory'",
                    },
                    url: {
                      type: "string",
                      description:
                        "URL to the research paper, DOI, or reputable source (Google Scholar, SSRN, NBER, etc.)",
                    },
                  },
                  required: ["title", "body", "citation", "url"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_nudge" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const nudge = JSON.parse(toolCall.function.arguments);
    nudge.url = await validateUrl(nudge.url, nudge.citation);

    return new Response(JSON.stringify(nudge), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ground-nudge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
