import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── CURATED FALLBACKS ──
const CURATED_FALLBACKS = [
  {
    title: "When gold crashed 26% in 2013",
    btcInsight: "Between April 12-15, 2013, gold plummeted from $1,560 to $1,321 per ounce — a 26% crash in three days. Panic sellers locked in generational losses. Those who held saw gold consolidate and stabilize, eventually becoming a cornerstone of central bank reserves again.",
    analogy: "The same pattern preceded every major Bitcoin recovery: sharp fear, forced selling, then quiet accumulation by those who understood what they owned.",
    assetClass: "Gold",
    period: "April 2013",
    source: "Financial Times historical archive",
    url: "https://www.ft.com/",
  },
  {
    title: "Amazon lost 95% and became the everything store",
    btcInsight: "From its December 1999 peak of $106.69, Amazon crashed to $5.51 by October 2001 — a 95% drawdown. The narrative shifted from 'revolutionary' to 'overvalued dot-com.' Anyone who sold at $5.51 missed a stock that would eventually reach $3,000+.",
    analogy: "Bitcoin has experienced five drawdowns of 70%+ in its history. Each time, the 'it's dead' narrative peaked at the bottom.",
    assetClass: "Tech stocks",
    period: "2000-2001",
    source: "Historical stock data",
    url: "https://en.wikipedia.org/wiki/Amazon_(company)#Stock",
  },
  {
    title: "The 2020 COVID crash recovered in 40 days",
    btcInsight: "On March 12, 2020 — 'Black Thursday' — Bitcoin fell from $7,900 to $3,800 in 24 hours, a 52% single-day crash. It was the fastest drawdown in Bitcoin's history. Yet within 40 days, BTC had recovered to pre-crash levels, and within 9 months it set a new all-time high.",
    analogy: "The S&P 500 followed a similar pattern, crashing 34% and fully recovering by August 2020. The lesson: the speed of the crash rarely predicts the timeline of recovery.",
    assetClass: "S&P 500",
    period: "March 2020",
    source: "CoinDesk historical data",
    url: "https://www.coindesk.com/",
  },
  {
    title: "The Swiss franc shock of 2015",
    btcInsight: "On January 15, 2015, the Swiss National Bank unexpectedly removed the EUR/CHF floor. The franc surged 30% in minutes, wiping out leveraged traders and bankrupting multiple brokerages. It was the largest single-day move in a major currency in modern history.",
    analogy: "Like Bitcoin's sudden moves, the Swiss franc shock demonstrated that markets can reprice decades of assumptions in minutes. Those with no leverage and long time horizons were unscathed.",
    assetClass: "Forex",
    period: "January 2015",
    source: "Bloomberg historical archive",
    url: "https://www.bloomberg.com/",
  },
  {
    title: "Bitcoin's 2018 winter lasted 12 months",
    btcInsight: "After reaching $19,783 in December 2017, Bitcoin entered a 12-month bear market that bottomed at $3,122 in December 2018 — an 84% drawdown. Most altcoins lost 95%+. The narrative shifted entirely from 'new paradigm' to 'dead technology.'",
    analogy: "The dot-com bust of 2000 saw the NASDAQ lose 78% over 30 months. Both events cleared speculative excess while the underlying technology continued developing.",
    assetClass: "NASDAQ",
    period: "December 2017 – December 2018",
    source: "CoinMarketCap historical data",
    url: "https://coinmarketcap.com/currencies/bitcoin/",
  },
];

// ── BANNED AI-SLOP PHRASES ──
const BANNED_PHRASES = ["dive into", "game-changer", "paradigm shift", "revolutionary", "unprecedented", "navigate the", "in the world of", "it's worth noting", "at the end of the day", "moving forward", "leverage", "synergy", "ecosystem", "disruptive", "next-gen", "cutting-edge"];

const MIN_BODY_LENGTH = 80;

function containsSlop(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some(p => lower.includes(p));
}

function passesQualityGate(insight: any): boolean {
  if (!insight?.title || !insight?.btcInsight) return false;
  if ((insight.btcInsight || "").length < MIN_BODY_LENGTH) return false;
  if (containsSlop(insight.btcInsight) || containsSlop(insight.analogy || "")) return false;
  return true;
}

/** Fallback chain: cache → curated. Returns { data, source, cacheId } for observability + feedback. */
async function serveFallback(svcClient: any, excludeIds?: string[]): Promise<{ data: any; source: string; cacheId: string | null }> {
  try {
    let query = svcClient
      .from("companion_cache")
      .select("id, content, used_count")
      .eq("companion_type", "historical_insight")
      .eq("language", "en")
      .gte("quality_score", 2)
      .order("used_count", { ascending: true })
      .limit(10);
    const { data } = await query;
    const filtered = excludeIds?.length ? (data || []).filter((d: any) => !excludeIds.includes(d.id)) : (data || []);
    const pool = filtered.length > 0 ? filtered : (data || []);
    if (pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
      svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
      return { data: pick.content, source: "cache", cacheId: pick.id };
    }
  } catch { /* continue to curated */ }
  return { data: CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)], source: "curated", cacheId: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const t0 = Date.now();
  const log = (msg: string) => console.log(`[historical-insight] ${msg} (+${Date.now() - t0}ms)`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const svcClient = createClient(sbUrl, serviceRoleKey, { auth: { persistSession: false } });
    const token = authHeader.replace("Bearer ", "");

    let resolvedUserId: string | null = null;
    if (token === serviceRoleKey) {
      // server-to-server
    } else {
      const sbClient = createClient(sbUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error: authError } = await sbClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      resolvedUserId = user.id;
    }

    const { context, userId: bodyUserId, mood, recentTitles } = await req.json();
    const effectiveUserId = resolvedUserId || bodyUserId;

    if (effectiveUserId) {
      try { await svcClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "historical_insight_ai_call" }); } catch (_) { /* non-fatal */ }
    }

    // Observability helper — fire-and-forget
    const trackObs = (event: string, meta?: Record<string, any>) => {
      if (!effectiveUserId) return;
      svcClient.from("analytics_events").insert({
        user_id: effectiveUserId, event,
        metadata: { companion_type: "historical_insight", latency_ms: Date.now() - t0, ...meta },
      }).then(() => {});
    };

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      log("missing API keys, serving fallback");
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const marketContext = context || "Bitcoin market movement";
    const moodContext = mood ? `The user is currently feeling "${mood}".` : "";
    const titleExclusion = (recentTitles && Array.isArray(recentTitles) && recentTitles.length > 0)
      ? `\nDo NOT cover these topics (already shown recently): ${recentTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT historical event.`
      : "";
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

    // ── Step 1: Perplexity search ──
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
              content: `You are a financial historian specializing in ${randomEra.era}. Search for ONE specific historical event with exact dates, prices, and percentage moves. Do NOT give a general overview — find a specific incident. Include what happened afterward (recovery timeline). Draw from: ${randomEra.examples}. Be precise with numbers.${titleExclusion}`,
            },
            { role: "user", content: `Find a specific historical financial event from ${randomEra.era} that parallels current Bitcoin conditions: ${marketContext}. ${moodContext} Include exact dates, prices, percentage moves, and what happened after.` },
          ],
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
    } catch (e) {
      log(`perplexity failed: ${e}`);
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!searchContent) {
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated");
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Step 2: AI structuring ──
    log("calling AI structuring");
    const aiBody = {
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a financial historian for a Bitcoin mindfulness app. Extract ONE historical insight with a cross-asset analogy.

Return a JSON object with these keys:
- "title": Short evocative title specific to the event (NOT generic like "Market Volatility")
- "btcInsight": 2-3 sentences about the specific event with real dates/numbers
- "analogy": 1-2 sentences drawing a parallel from another asset class
- "assetClass": The other asset class (e.g. "Gold", "Tech stocks")
- "period": Historical period (e.g. "January 2015")
- "source": Source name
- "url": URL from citations

ACCURACY RULES (CRITICAL):
- Use ONLY dates, prices, percentages from the search results
- Do NOT invent historical prices or recovery timelines
- End with "this too passed" energy, not hype or doom

BANNED PHRASES — NEVER use any of these: ${BANNED_PHRASES.join(", ")}${mood ? `\n\nUSER MOOD: The user is feeling "${mood}". Subtly calibrate the historical parallel to resonate with this emotional state.` : ""}${titleExclusion}`,
        },
        {
          role: "user",
          content: `Market context: ${marketContext}\n\nSearch results:\n${searchContent}\n\nCitation URLs:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}`,
        },
      ],
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
    let insight: any = null;

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
        const raw = data.choices?.[0]?.message?.content || "";
        try {
          insight = JSON.parse(raw);
        } catch {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) insight = JSON.parse(m[0]);
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

    if (!insight || !passesQualityGate(insight)) {
      log(`quality gate failed: ${!insight ? "no insight" : `body=${(insight.btcInsight||"").length}chars, slop=${containsSlop(insight?.btcInsight||"") || containsSlop(insight?.analogy||"")}`}`);
      const fb = await serveFallback(svcClient);
      trackObs(fb.source === "cache" ? "companion_cache_hit" : "companion_fallback_curated", { reason: "quality_gate" });
      return new Response(JSON.stringify({ ...fb.data, _cache_id: fb.cacheId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Ensure URL is from citations
    if (citations.length > 0 && !citations.includes(insight.url)) {
      insight.url = citations[0];
    }

    // ── URL validation via HEAD request ──
    if (insight.url) {
      try {
        const urlController = new AbortController();
        const urlTimeout = setTimeout(() => urlController.abort(), 3000);
        const headRes = await fetch(insight.url, { method: "HEAD", redirect: "follow", signal: urlController.signal });
        clearTimeout(urlTimeout);
        if (headRes.status >= 400) {
          log(`URL ${insight.url} returned ${headRes.status}, clearing`);
          let validUrl = "";
          for (const c of citations) {
            if (c === insight.url) continue;
            try {
              const uc = new AbortController();
              const ut = setTimeout(() => uc.abort(), 2000);
              const r = await fetch(c, { method: "HEAD", redirect: "follow", signal: uc.signal });
              clearTimeout(ut);
              if (r.status < 400) { validUrl = c; break; }
            } catch { continue; }
          }
          insight.url = validUrl || insight.source || "";
        }
      } catch {
        log(`URL validation timed out for ${insight.url}`);
      }
    }

    // Cache good content with title-based dedup
    if (insight.title && insight.btcInsight && passesQualityGate(insight)) {
      (async () => {
        try {
          const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "historical_insight").eq("language", "en").limit(30);
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
          const newNorm = norm(insight.title);
          const isDup = existing?.some((e: any) => {
            const t = norm(e.content?.title || "");
            return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
          });
          if (!isDup) {
            await svcClient.from("companion_cache").insert({ companion_type: "historical_insight", language: "en", content: insight, quality_score: 2 });
          }
        } catch { /* non-fatal */ }
      })();
    }

    trackObs("companion_live_generated");
    log(`done: ${insight.title}`);
    return new Response(JSON.stringify({ ...insight, _serve_source: "live" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("historical-insight error:", e);
    try {
      const fallback = CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)];
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
});
