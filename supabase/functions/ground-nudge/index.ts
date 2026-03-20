import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── CURATED FALLBACKS ──
const CURATED_FALLBACKS = [
  {
    title: "Loss aversion doubles the sting of dropping prices",
    body: "Kahneman and Tversky's 1979 prospect theory study showed that losses feel roughly twice as painful as equivalent gains feel good. When BTC drops 5%, your brain processes it as if you lost 10%. This asymmetry is hardwired — recognizing it is the first step to not acting on it.",
    citation: "Kahneman & Tversky (1979), Prospect Theory: An Analysis of Decision under Risk",
    url: "https://scholar.google.com/scholar?q=kahneman+tversky+prospect+theory+1979",
  },
  {
    title: "The disposition effect: why we sell winners and hold losers",
    body: "Shefrin and Statman's 1985 study found that investors are 50% more likely to sell a winning position than a losing one. We lock in gains too early out of fear, and hold losses too long out of hope. The pattern repeats across every asset class — including Bitcoin.",
    citation: "Shefrin & Statman (1985), The Disposition to Sell Winners Too Early and Ride Losers Too Long",
    url: "https://scholar.google.com/scholar?q=shefrin+statman+disposition+effect+1985",
  },
  {
    title: "Social proof cascades: when everyone sells, your brain wants to follow",
    body: "Bikhchandani, Hirshleifer, and Welch's 1992 research on information cascades showed that rational individuals can make irrational collective decisions by mimicking others. In crypto markets, this amplifies both panic selling and FOMO buying beyond any fundamental justification.",
    citation: "Bikhchandani, Hirshleifer & Welch (1992), A Theory of Fads, Fashion, Custom, and Cultural Change as Informational Cascades",
    url: "https://scholar.google.com/scholar?q=bikhchandani+hirshleifer+welch+informational+cascades+1992",
  },
  {
    title: "Your prefrontal cortex goes offline during financial stress",
    body: "Lo and Repin's 2002 study using real-time physiological monitoring of traders found that market volatility triggers measurable autonomic nervous system responses — elevated heart rate, skin conductance changes — that impair the prefrontal cortex's capacity for rational decision-making.",
    citation: "Lo & Repin (2002), The Psychophysiology of Real-Time Financial Risk Processing",
    url: "https://scholar.google.com/scholar?q=lo+repin+psychophysiology+financial+risk+2002",
  },
  {
    title: "Recency bias: your brain over-weights the last 48 hours",
    body: "Tversky and Kahneman's availability heuristic research demonstrated that people judge probability based on how easily examples come to mind. A sharp BTC drop yesterday looms larger than years of steady gains. Your memory is not a balanced ledger — it's a highlight reel biased toward the recent.",
    citation: "Tversky & Kahneman (1973), Availability: A Heuristic for Judging Frequency and Probability",
    url: "https://scholar.google.com/scholar?q=tversky+kahneman+availability+heuristic+1973",
  },
];

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

const BANNED_PHRASES = ["dive into", "game-changer", "paradigm shift", "revolutionary", "unprecedented", "navigate the", "in the world of", "it's worth noting", "at the end of the day", "moving forward", "leverage", "synergy", "ecosystem", "disruptive", "next-gen", "cutting-edge"];
const MIN_BODY_LENGTH = 80;

function containsSlop(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some(p => lower.includes(p));
}

function passesQualityGate(nudge: any): boolean {
  if (!nudge?.title || !nudge?.body) return false;
  if ((nudge.body || "").length < MIN_BODY_LENGTH) return false;
  if (containsSlop(nudge.body) || containsSlop(nudge.title)) return false;
  return true;
}

/** Fallback chain: cache (highest rated, unexpired, least recently served) → curated. */
async function serveFallback(svcClient: any, excludeIds?: string[]): Promise<{ data: any; source: string; cacheId: string | null }> {
  try {
    const now = new Date().toISOString();
    const { data } = await svcClient
      .from("companion_cache")
      .select("id, content, quality_score, used_count")
      .eq("companion_type", "ground_nudge")
      .eq("language", "en")
      .gte("quality_score", 2)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("quality_score", { ascending: false })
      .order("last_served_at", { ascending: true, nullsFirst: true })
      .order("used_count", { ascending: true })
      .limit(10);
    const filtered = excludeIds?.length ? (data || []).filter((d: any) => !excludeIds.includes(d.id)) : (data || []);
    const pool = filtered.length > 0 ? filtered : (data || []);
    if (pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 3))];
      svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1, last_served_at: now }).eq("id", pick.id).then(() => {});
      return { data: pick.content, source: "cache", cacheId: pick.id };
    }
    // Second pass: any quality
    const { data: anyQ } = await svcClient
      .from("companion_cache")
      .select("id, content, used_count")
      .eq("companion_type", "ground_nudge")
      .eq("language", "en")
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("quality_score", { ascending: false })
      .order("used_count", { ascending: true })
      .limit(5);
    const anyFiltered = excludeIds?.length ? (anyQ || []).filter((d: any) => !excludeIds.includes(d.id)) : (anyQ || []);
    const anyPool = anyFiltered.length > 0 ? anyFiltered : (anyQ || []);
    if (anyPool.length > 0) {
      const pick = anyPool[Math.floor(Math.random() * Math.min(anyPool.length, 3))];
      svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1, last_served_at: now }).eq("id", pick.id).then(() => {});
      return { data: pick.content, source: "cache", cacheId: pick.id };
    }
  } catch { /* continue to curated */ }
  return { data: CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)], source: "curated", cacheId: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const log = (msg: string) => console.log(`[ground-nudge] ${msg} (+${Date.now() - t0}ms)`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbClient = createClient(sbUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await sbClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { context, recentTopics } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

    // Observability helper — fire-and-forget
    const trackObs = (event: string, meta?: Record<string, any>) => {
      svcClient.from("analytics_events").insert({
        user_id: user.id, event,
        metadata: { companion_type: "ground_nudge", latency_ms: Date.now() - t0, ...meta },
      }).then(() => {});
    };

    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      log("missing API keys, serving fallback");
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    const marketContext = context || "Bitcoin market volatility";
    const searchQuery = `Find a specific academic study or research paper about ${randomBias}. The research should be relevant to: ${marketContext}. Include the researcher names, university, year of publication, sample size or key methodology detail, and the main finding. Prefer peer-reviewed journals.`;

    // ── Step 1: Perplexity academic search ──
    log("calling perplexity");
    let searchContent = "";
    let citations: string[] = [];

    try {
      const searchController = new AbortController();
      const searchTimeout = setTimeout(() => searchController.abort(), 10000);
      const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: "You are a behavioral finance research assistant. Search for real, specific academic research papers. Return ONE specific study with exact researcher names, publication year, journal name, and quantitative findings. Prefer lesser-known but fascinating studies over the most commonly cited ones.",
            },
            { role: "user", content: searchQuery },
          ],
          search_mode: "academic",
        }),
        signal: searchController.signal,
      });
      clearTimeout(searchTimeout);
      log(`perplexity responded ${searchResponse.status}`);

      if (!searchResponse.ok) {
        await searchResponse.text();
        throw new Error(`Perplexity ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      searchContent = searchData.choices?.[0]?.message?.content || "";
      citations = searchData.citations || [];
      log(`content length: ${searchContent.length}, citations: ${citations.length}`);
    } catch (e) {
      log(`perplexity failed: ${e}`);
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!searchContent) {
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Step 2: AI structuring ──
    log("calling AI structuring");
    const aiBody = {
      messages: [
        {
          role: "system",
          content: `Extract ONE grounding nudge from the search results below.

TONE: Calm, grounding, educational. Like a professor gently explaining why your brain is lying to you right now.
TITLE: Name the bias or finding clearly (5-15 words). Should feel like a section heading in a textbook.
BODY: 2-3 sentences that explain the research finding and why it matters right now. Reference the researchers by name and year.
CITATION: Formatted as "Author(s) (Year), Paper Title" — exactly as it appears in the search results.

ACCURACY RULES (CRITICAL):
- Use ONLY facts, names, dates, and numbers from the search results
- Do NOT invent researcher names, years, journals, or statistics
- If the search results are vague, keep the body general
- Copy citation URLs character-for-character from the list

BANNED PHRASES — NEVER use any of these: dive into, game-changer, paradigm shift, revolutionary, unprecedented, navigate the, in the world of, it's worth noting, at the end of the day, moving forward, leverage, synergy, ecosystem, disruptive, next-gen, cutting-edge`,
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
              citation: { type: "string", description: "Formatted: Author(s) (Year), Paper Title" },
              url: { type: "string", description: "Citation URL copied character-for-character" },
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

    const AI_TIMEOUTS = [8000, 6000];
    for (let idx = 0; idx < models.length; idx++) {
      const model = models[idx];
      const aiController = new AbortController();
      const aiTimeout = setTimeout(() => aiController.abort(), AI_TIMEOUTS[idx]);
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...aiBody, model }),
          signal: aiController.signal,
        });
        clearTimeout(aiTimeout);
        log(`AI ${model} responded ${res.status}`);

        if (!res.ok) { await res.text(); if (model !== models[models.length - 1]) continue; break; }

        const data = await res.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        const content = toolCall?.function?.arguments || data.choices?.[0]?.message?.content;
        if (!content) { if (model !== models[models.length - 1]) continue; break; }

        try {
          nudge = typeof content === "string" ? JSON.parse(content) : content;
        } catch {
          const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
          if (m) nudge = JSON.parse(m[0]);
          else if (model !== models[models.length - 1]) continue;
          else break;
        }
        break;
      } catch (e) {
        clearTimeout(aiTimeout);
        if (model !== models[models.length - 1]) continue;
        break;
      }
    }

    if (!nudge || !passesQualityGate(nudge)) {
      log(`quality gate failed: ${!nudge ? "no nudge" : `body=${(nudge.body||"").length}chars, slop=${containsSlop(nudge?.body||"") || containsSlop(nudge?.title||"")}`}`);
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated", { reason: "quality_gate" });
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId, _serve_source: fb.source }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Post-processing: URL validation ──
    if (citations.length > 0 && !citations.includes(nudge.url)) {
      nudge.url = citations[0];
    }

    let qualityScore = 1;
    if (nudge.url) {
      const reachable = await isUrlReachable(nudge.url);
      if (!reachable) {
        let found = false;
        for (const c of citations) {
          if (c !== nudge.url && await isUrlReachable(c)) { nudge.url = c; found = true; break; }
        }
        if (!found) {
          const searchTerm = encodeURIComponent(nudge.citation || nudge.title || "behavioral finance");
          nudge.url = `https://scholar.google.com/scholar?q=${searchTerm}`;
        }
      } else {
        qualityScore = 2;
      }
    }

    // Cache good content with rich metadata and title-based dedup
    if (nudge.title && nudge.body && nudge.citation && qualityScore > 0 && passesQualityGate(nudge)) {
      (async () => {
        try {
          const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "ground_nudge").eq("language", "en").limit(30);
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
          const newNorm = norm(nudge.title);
          const isDup = existing?.some((e: any) => {
            const t = norm(e.content?.title || "");
            return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
          });
          if (!isDup) {
            let sourceHost = "";
            try { sourceHost = nudge.url ? new URL(nudge.url.startsWith("http") ? nudge.url : `https://${nudge.url}`).hostname.replace(/^www\./, "") : ""; } catch {}
            const fingerprint = btoa(newNorm).slice(0, 32);
            await svcClient.from("companion_cache").insert({
              companion_type: "ground_nudge",
              language: "en",
              content: nudge,
              quality_score: qualityScore,
              title: nudge.title,
              title_norm: newNorm,
              fingerprint,
              source_kind: "academic_paper",
              source_title: nudge.citation || null,
              source_author: nudge.citation?.split("(")[0]?.trim() || null,
              source_url: nudge.url || null,
              source_host: sourceHost || null,
              citations: citations.length > 0 ? JSON.stringify(citations) : null,
              expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
              last_validated_at: qualityScore >= 2 ? new Date().toISOString() : null,
              automated_score: qualityScore,
            });
          } else { log("cache dedup: skipped duplicate title"); }
        } catch { /* non-fatal */ }
      })();
    }

    trackObs("companion_live_generated");
    log(`done: ${nudge.title}`);
    return new Response(JSON.stringify({ ...nudge, _serve_source: "live" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ground-nudge error:", e);
    try {
      const fallback = CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)];
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
});
