import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { context, language, sources } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    // Pick a random bias category to ensure variety across sessions
    const BIAS_TOPICS = [
      "loss aversion and panic selling during market drops",
      "FOMO and herding behavior during market rallies",
      "disposition effect — selling winners too early and holding losers too long",
      "anchoring bias and mental accounting in investment decisions",
      "emotional regulation and prefrontal cortex function during financial stress",
      "endowment effect and status quo bias in portfolio management",
      "recency bias and availability heuristic in market predictions",
      "overconfidence bias and illusion of control in trading decisions",
      "regret aversion and its effect on long-term investment holding",
      "social proof and information cascading in crypto markets",
    ];
    const randomBias = BIAS_TOPICS[Math.floor(Math.random() * BIAS_TOPICS.length)];

    const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(perplexityBody),
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
    const langInstruction = langCode !== "en" ? `Write in ${langName}. Keep citation names and URLs as-is.\n` : "";

    const aiBody = {
      messages: [
        {
          role: "system",
          content: `${langInstruction}Extract ONE grounding nudge from the search results as JSON: {"title":"short bias/finding summary","body":"2-3 sentences referencing researchers and years","citation":"formatted like Kahneman & Tversky (1979), Prospect Theory","url":"citation URL"}. Use only facts from the results. Tone: calm, grounding, no advice.`,
        },
        {
          role: "user",
          content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nCitation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}`,
        },
      ],
      response_format: { type: "json_object" },
    };

    const models = ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash"];
    let nudge: any = null;
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
          body: JSON.stringify({ ...aiBody, model }),
          signal: aiController.signal,
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
        const content = structureData.choices?.[0]?.message?.content;
        if (!content) {
          if (model !== models[models.length - 1]) continue;
          throw new Error("No nudge returned from AI");
        }

        try {
          nudge = typeof content === "string" ? JSON.parse(content) : content;
        } catch {
          const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
          if (m) nudge = JSON.parse(m[0]);
          else if (model !== models[models.length - 1]) continue;
          else throw new Error("AI returned invalid JSON");
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

    if (!nudge) {
      if (lastStatus === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI structuring failed");
    }

    // Ensure URL is from citations
    if (citations.length > 0 && !citations.includes(nudge.url)) {
      nudge.url = citations[0];
    }

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
