import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Track AI usage
    const userId = claimsData.claims.sub as string;
    const svcClient = (await import("npm:@supabase/supabase-js@2.57.2")).createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    try { await svcClient.from("analytics_events").insert({ user_id: userId, event: "historical_insight_ai_call" }); } catch (_) { /* non-fatal */ }

    const { context, language } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    const marketContext = context || "Bitcoin market movement";

    // Step 1: Perplexity search for historical parallels (open web, no domain filter)
    const searchQuery = `Historical financial event parallel to current Bitcoin market: ${marketContext}. Find a specific historical event from Bitcoin history, gold markets, tech stocks, or other asset classes that mirrors the current conditions. Include specific dates, prices, and percentage moves.`;

    const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a financial historian. Search for specific historical events from Bitcoin, gold, equities, tech stocks, commodities, or macro economics that parallel current market conditions. Always include specific dates, prices, percentage moves, and factual data. Draw from diverse eras: Bitcoin crashes, gold's 1980 peak, dot-com bubble, 2008 crisis, tech stock collapses, oil price shocks, etc.",
          },
          { role: "user", content: searchQuery },
        ],
      }),
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Perplexity error:", searchResponse.status, errText);
      if (searchResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Perplexity search failed");
    }

    const searchData = await searchResponse.json();
    const searchContent = searchData.choices?.[0]?.message?.content || "";
    const citations: string[] = searchData.citations || [];

    // Step 2: Lovable AI structures the grounded result (JSON mode, fallback model retry)
    const langInstruction = langCode !== "en" ? `CRITICAL: Write title, btcInsight, and analogy in ${langName}. Keep source URLs as-is.\n\n` : "";

    const aiBody = {
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${langInstruction}You are a financial historian for a Bitcoin mindfulness app. Given grounded search results with citations, extract ONE historical insight with a cross-asset analogy.

Respond with a JSON object containing exactly these keys:
- "title": Short evocative title
- "btcInsight": 2-3 sentences about a specific historical event with real dates/numbers
- "analogy": 1-2 sentences drawing a parallel from another asset class
- "assetClass": The other asset class (e.g. "Gold", "Tech stocks")
- "period": Historical period (e.g. "2014", "March 2020")
- "source": Name of the source
- "url": URL from the provided citations

Rules:
- Use ONLY facts from the provided search results
- Include specific dates, prices, and percentage moves
- Draw a clear parallel between a historical event and the current context
- End with a grounding observation, not hype
- URL: use one of the provided citation URLs`,
        },
        {
          role: "user",
          content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nAvailable citation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}\n\nExtract one historical insight with cross-asset analogy. Return JSON only.`,
        },
      ],
    };

    const models = ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash"];
    let insight: Record<string, string> | null = null;
    let lastStatus = 500;

    for (const model of models) {
      const aiController = new AbortController();
      const aiTimeout = setTimeout(() => aiController.abort(), 18000);
      try {
        const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: aiController.signal,
          body: JSON.stringify({ ...aiBody, model }),
        });
        clearTimeout(aiTimeout);

        if (structureResponse.status === 429 || structureResponse.status === 402) {
          lastStatus = structureResponse.status;
          await structureResponse.text();
          break;
        }
        if (!structureResponse.ok) {
          const t = await structureResponse.text();
          console.error(`AI ${model} error:`, structureResponse.status, t);
          lastStatus = structureResponse.status;
          if (model !== models[models.length - 1]) continue;
          break;
        }

        const structureData = await structureResponse.json();
        const raw = structureData.choices?.[0]?.message?.content || "";
        try {
          insight = JSON.parse(raw);
        } catch {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) insight = JSON.parse(m[0]);
          else if (model !== models[models.length - 1]) continue;
          else throw new Error("Could not parse AI JSON response");
        }
        break;
      } catch (e) {
        clearTimeout(aiTimeout);
        if (e instanceof DOMException && e.name === "AbortError") {
          lastStatus = 504;
          if (model !== models[models.length - 1]) continue;
          return new Response(JSON.stringify({ error: "AI structuring timed out" }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw e;
      }
    }

    if (!insight) {
      if (lastStatus === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI structuring failed");
    }

    // Ensure URL is from citations
    if (citations.length > 0 && !citations.includes(insight.url)) {
      insight.url = citations[0];
    }

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
