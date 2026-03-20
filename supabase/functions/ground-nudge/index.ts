import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** HEAD-check a URL, return true if reachable (2xx/3xx) */
async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || url.length < 10) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

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
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const sbClient = createClient(sbUrl, sbAnon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await sbClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { context, language, recentTopics } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";

    // Pick a bias category, avoiding recently used ones
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
    const recentSet = new Set((recentTopics || []).map((t: string) => t.toLowerCase()));
    const available = BIAS_TOPICS.filter(t => !recentSet.has(t.toLowerCase()));
    const pool = available.length > 0 ? available : BIAS_TOPICS;
    const randomBias = pool[Math.floor(Math.random() * pool.length)];

    // Step 1: Perplexity search for behavioral finance research
    const marketContext = context || "Bitcoin market volatility";
    const searchQuery = `Find a specific academic study or research paper about ${randomBias}. The research should be relevant to: ${marketContext}. Include the researcher names, university, year of publication, sample size or key methodology detail, and the main finding. Prefer peer-reviewed journals.`;

    const perplexityBody: any = {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "You are a behavioral finance research assistant. Search for real, specific academic research papers and credible findings. Return ONE specific study with exact researcher names, publication year, journal name, and quantitative findings. Do NOT return generic overviews — find a specific paper. Prefer lesser-known but fascinating studies over the most commonly cited ones (e.g. avoid just repeating Kahneman & Tversky prospect theory unless highly specific).",
        },
        { role: "user", content: searchQuery },
      ],
      search_mode: "academic",
    };

    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 12000);
    let searchResponse: Response;
    try {
      searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(perplexityBody),
        signal: searchController.signal,
      });
      clearTimeout(searchTimeout);
    } catch (e) {
      clearTimeout(searchTimeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        // Try fallback cache
        const fallback = await serveFallback(svcClient, "ground_nudge", langCode);
        if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Search timed out" }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw e;
    }

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Perplexity error:", searchResponse.status, errText);
      if (searchResponse.status === 429) {
        const fallback = await serveFallback(svcClient, "ground_nudge", langCode);
        if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("Perplexity search failed");
    }

    const searchData = await searchResponse.json();
    const searchContent = searchData.choices?.[0]?.message?.content || "";
    const citations: string[] = searchData.citations || [];

    // Step 2: Lovable AI structures the grounded result
    const langInstruction = langCode !== "en" ? `Write in ${langName}. Keep citation names and URLs as-is.\n` : "";

    const aiBody = {
      messages: [
        {
          role: "system",
          content: `${langInstruction}Extract ONE grounding nudge from the search results below.

ACCURACY RULES (CRITICAL):
- Use ONLY facts, names, dates, and numbers that appear in the search results below
- Do NOT invent researcher names, publication years, journal names, or statistics
- If the search results are vague, keep the body general rather than fabricating specifics
- Copy citation URLs character-for-character from the provided list

Tone: calm, grounding, no advice.`,
        },
        {
          role: "user",
          content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nCitation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}`,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_grounding_nudge",
          description: "Return a single grounding nudge extracted from search results",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short bias/finding summary (5-15 words)" },
              body: { type: "string", description: "2-3 sentences referencing researchers and years" },
              citation: { type: "string", description: "Formatted like: Kahneman & Tversky (1979), Prospect Theory" },
              url: { type: "string", description: "Citation URL copied character-for-character from the list" },
            },
            required: ["title", "body", "citation", "url"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_grounding_nudge" } },
      temperature: 0.3,
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
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
          const fallback = await serveFallback(svcClient, "ground_nudge", langCode);
          if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ error: "AI structuring timed out" }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw e;
      }
    }

    if (!nudge) {
      const fallback = await serveFallback(svcClient, "ground_nudge", langCode);
      if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI structuring failed");
    }

    // Ensure URL is from citations
    if (citations.length > 0 && !citations.includes(nudge.url)) {
      nudge.url = citations[0];
    }

    // URL validation — verify the URL is reachable
    let qualityScore = 1;
    if (nudge.url) {
      const reachable = await isUrlReachable(nudge.url);
      if (!reachable) {
        // Try other citations
        let found = false;
        for (const c of citations) {
          if (c !== nudge.url && await isUrlReachable(c)) {
            nudge.url = c;
            found = true;
            break;
          }
        }
        if (!found) {
          // Use a Google Scholar search as fallback
          const searchTerm = encodeURIComponent(nudge.citation || nudge.title || "behavioral finance");
          nudge.url = `https://scholar.google.com/scholar?q=${searchTerm}`;
        }
      } else {
        qualityScore = 2; // URL verified = higher quality
      }
    }

    // Cache good content for future fallback
    if (nudge.title && nudge.body && nudge.citation) {
      svcClient.from("companion_cache").insert({
        companion_type: "ground_nudge",
        language: langCode,
        content: nudge,
        quality_score: qualityScore,
      }).then(() => {});
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

/** Serve a random high-quality cached entry as fallback */
async function serveFallback(svcClient: any, type: string, lang: string): Promise<any | null> {
  try {
    const { data } = await svcClient
      .from("companion_cache")
      .select("id, content, used_count")
      .eq("companion_type", type)
      .eq("language", lang)
      .gte("quality_score", 2)
      .order("used_count", { ascending: true })
      .limit(5);
    if (!data || data.length === 0) {
      // Try any quality
      const { data: any } = await svcClient
        .from("companion_cache")
        .select("id, content, used_count")
        .eq("companion_type", type)
        .eq("language", lang)
        .order("used_count", { ascending: true })
        .limit(5);
      if (!any || any.length === 0) return null;
      const pick = any[Math.floor(Math.random() * any.length)];
      svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
      return pick.content;
    }
    const pick = data[Math.floor(Math.random() * data.length)];
    svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
    return pick.content;
  } catch {
    return null;
  }
}
