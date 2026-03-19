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
    // Auth check — support both user JWT and service role key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const token = authHeader.replace("Bearer ", "");

    let resolvedUserId: string | null = null;
    if (token === serviceRoleKey) {
      // Called server-to-server; userId must be in the body
    } else {
      const sbClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
      const { data: claimsData, error: claimsError } = await sbClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      resolvedUserId = claimsData.claims.sub as string;
    }

    const { context, language, userId: bodyUserId } = await req.json();
    const effectiveUserId = resolvedUserId || bodyUserId;

    // Track AI usage
    if (effectiveUserId) {
      const svcClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        serviceRoleKey,
        { auth: { persistSession: false } }
      );
      try { await svcClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "historical_insight_ai_call" }); } catch (_) { /* non-fatal */ }
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    const marketContext = context || "Bitcoin market movement";

    // Randomize the historical era to avoid always returning Mt. Gox / same event
    const HISTORICAL_ERAS = [
      { era: "early Bitcoin (2011-2013)", examples: "Bitcoin's first bubble to $32 then crash to $2, the 2013 China ban crash" },
      { era: "Mt. Gox era (2014-2015)", examples: "Mt. Gox collapse, the long crypto winter of 2014-2015" },
      { era: "ICO boom and bust (2017-2018)", examples: "Bitcoin's rise to $20k, the 2018 crash, ICO mania" },
      { era: "COVID and institutional era (2020-2021)", examples: "March 2020 crash, MicroStrategy buys, El Salvador adoption, $69k peak" },
      { era: "crypto winter (2022-2023)", examples: "Luna/Terra collapse, FTX fraud, contagion effects" },
      { era: "traditional finance parallels", examples: "1987 Black Monday, dot-com bubble 2000, 2008 financial crisis, gold's 1980 peak" },
      { era: "commodity and forex history", examples: "oil price shocks, Swiss franc unpegging, Asian financial crisis 1997" },
      { era: "tech stock parallels", examples: "Amazon's 95% crash, Apple near-bankruptcy, Cisco post-dot-com" },
    ];
    const randomEra = HISTORICAL_ERAS[Math.floor(Math.random() * HISTORICAL_ERAS.length)];

    // Step 1: Perplexity search for historical parallels
    const searchQuery = `Find a specific historical financial event from ${randomEra.era} (examples: ${randomEra.examples}) that parallels current Bitcoin market conditions: ${marketContext}. Include exact dates, prices, percentage moves, and what happened in the months/years after. Be specific — name the exact event, not a general overview.`;

    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 12000);
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
            content: `You are a financial historian specializing in ${randomEra.era}. Search for ONE specific historical event with exact dates, prices, and percentage moves. Do NOT give a general market overview — find a specific incident, crash, rally, or turning point. Include what happened afterward (recovery timeline). Draw from: ${randomEra.examples}. Be precise with numbers.`,
          },
          { role: "user", content: searchQuery },
        ],
      }),
      signal: searchController.signal,
    });
    clearTimeout(searchTimeout);

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
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `${langInstruction}You are a financial historian for a Bitcoin mindfulness app. Given grounded search results with citations, extract ONE historical insight with a cross-asset analogy.

Respond with a JSON object containing exactly these keys:
- "title": Short evocative title (NOT generic like "Market Volatility" — be specific to the event)
- "btcInsight": 2-3 sentences about a specific historical event with real dates/numbers
- "analogy": 1-2 sentences drawing a parallel from another asset class or era
- "assetClass": The other asset class (e.g. "Gold", "Tech stocks", "Oil")
- "period": Historical period (e.g. "January 2015", "March 2020")
- "source": Name of the source
- "url": URL from the provided citations

ACCURACY RULES (CRITICAL):
- Use ONLY dates, prices, percentages, and event details that appear in the search results
- Do NOT invent or estimate historical prices, crash percentages, or recovery timelines
- If the search results lack specific numbers for the analogy, describe the pattern qualitatively
- Copy the URL character-for-character from the citation list

Rules:
- Include specific dates, prices, and percentage moves FROM the search results
- Draw a clear parallel between the historical event and the current context
- End with a grounding observation — "this too passed" energy, not hype or doom
- Be SPECIFIC — name the exact event, not a vague "market crash"`,
        },
        {
          role: "user",
          content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nAvailable citation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}\n\nExtract one historical insight with cross-asset analogy. Return JSON only.`,
        },
      ],
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
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
