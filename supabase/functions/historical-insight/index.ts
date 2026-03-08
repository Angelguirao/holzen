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
  return `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sbClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { context, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";
    const langInstruction = langCode !== "en" ? `\n\nLANGUAGE: Write the title, body, and analogy in ${langName}. Keep source URLs as-is.` : "";

    const systemPrompt = `You are a financial historian specializing in Bitcoin and broader market history. Given the current market context, provide ONE historical insight that helps a Bitcoin holder see today's moment through the lens of history.

Your insight MUST:
1. Reference a REAL, specific historical event — primarily from Bitcoin's history, but ALSO draw analogies from other assets (gold, equities, tech stocks, commodities, real estate, bonds, emerging market currencies)
2. Include specific dates, prices, and percentage moves where possible
3. Draw a clear parallel or analogy between the historical event and the current context
4. Be factually accurate — use real events, real numbers, real dates
5. Be concise — 2-3 sentences for the main insight, 1-2 sentences for the cross-asset analogy
6. End with a grounding observation, not hype
7. Include a source URL — link to a reputable article, Wikipedia page, or data source that documents the historical event referenced

VARIETY IS CRITICAL. Rotate through different eras and asset classes:
- Bitcoin: Mt. Gox crash (2014), China ban cycles, COVID crash (March 2020), 2017 bull run, 2018 bear, 2021 ATH & correction, halving cycles, exchange collapses (FTX)
- Gold: 1970s bull run, 1980 crash from $850 to $250, 2011 peak & 4-year bear, Nixon shock, Gold Reserve Act 1934
- Equities: Dot-com bubble & recovery, 1987 Black Monday, 2008 financial crisis, Nifty Fifty collapse, Japanese bubble 1989, South Sea Bubble
- Tech stocks: Amazon -94% (2000-2001), Apple near-bankruptcy (1997), Netflix -77% (2022)
- Commodities: Oil negative prices (2020), Silver Thursday (1980), Tulip mania
- Macro: Weimar hyperinflation, Bretton Woods collapse, Asian financial crisis 1997

The analogy should feel surprising and illuminating, not obvious.${langInstruction}`;

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
              content: `Current market context: ${context || "Bitcoin market movement"}. Provide one historical insight with a cross-asset analogy.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_historical_insight",
                description: "Return a historical insight with cross-asset analogy and source",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Short evocative title (e.g. 'The 2018 winter lasted 84 days at this level')",
                    },
                    btcInsight: {
                      type: "string",
                      description: "2-3 sentences about a specific Bitcoin historical event with real dates and numbers, drawing a parallel to now",
                    },
                    analogy: {
                      type: "string",
                      description: "1-2 sentences drawing a parallel from another asset class (gold, stocks, commodities, etc.) with specific historical data",
                    },
                    assetClass: {
                      type: "string",
                      description: "The other asset class referenced in the analogy (e.g. 'Gold', 'Tech stocks', 'Oil', 'S&P 500')",
                    },
                    period: {
                      type: "string",
                      description: "The historical period referenced (e.g. '2014', 'March 2020', '1987')",
                    },
                    source: {
                      type: "string",
                      description: "Name of the source documenting the event (e.g. 'Wikipedia', 'CoinDesk', 'Federal Reserve History')",
                    },
                    url: {
                      type: "string",
                      description: "URL to a reputable source documenting the historical event (Wikipedia, news archive, data source)",
                    },
                  },
                  required: ["title", "btcInsight", "analogy", "assetClass", "period", "source", "url"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_historical_insight" },
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
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const insight = JSON.parse(toolCall.function.arguments);
    insight.url = await validateUrl(insight.url, `${insight.title} ${insight.assetClass} ${insight.period}`);

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("historical-insight error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});