import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── CURATED FALLBACKS ──
// Hand-written, verified, high-quality philosophical Bitcoin insights
const CURATED_FALLBACKS = [
  {
    title: "Proof of work is proof of sacrifice",
    body: "Gigi argues that Bitcoin's proof-of-work mechanism mirrors a universal truth: nothing of value comes without cost. The energy expended isn't wasted — it's transformed into trust, the most scarce resource in human coordination.",
    source: "Gigi — 21 Lessons",
    url: "https://21lessons.com/",
  },
  {
    title: "Sound money teaches patience before it teaches wealth",
    body: "Saifedean Ammous observes that the hardest lesson Bitcoin teaches isn't about returns — it's about time preference. A society that saves in hard money naturally extends its planning horizon, building cathedrals instead of strip malls.",
    source: "Saifedean Ammous — The Bitcoin Standard",
    url: "https://saifedean.com/thebitcoinstandard/",
  },
  {
    title: "Sovereignty begins with what you refuse to delegate",
    body: "Parker Lewis writes that holding your own keys isn't a technical preference — it's a philosophical stance. Every system that asks you to trust a third party is a system that can betray you. Self-custody is the first act of self-sovereignty.",
    source: "Parker Lewis — Gradually, Then Suddenly",
    url: "https://unchained.com/gradually-then-suddenly/",
  },
  {
    title: "The price is the least interesting thing about Bitcoin",
    body: "Allen Farrington argues that fixating on price is like judging the printing press by the cost of paper. Bitcoin's real innovation is the separation of money and state — a shift as consequential as the separation of church and state.",
    source: "Allen Farrington — Bitcoin Is Venice",
    url: "https://allenfarrington.medium.com/",
  },
  {
    title: "Volatility is the price of admission to a new monetary order",
    body: "Vijay Boyapati observes that every new monetary good must pass through a period of extreme volatility on its path to stable purchasing power. Gold was volatile for centuries. Bitcoin is compressing that journey into decades.",
    source: "Vijay Boyapati — The Bullish Case for Bitcoin",
    url: "https://vijayboyapati.medium.com/the-bullish-case-for-bitcoin-6ecc8bdecc1",
  },
];

function isValidUrl(s: string): boolean {
  if (!s || s === "N/A" || s.length < 10) return false;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeUrl(s: string): string {
  if (!s) return "";
  if (!s.startsWith("http")) return `https://${s}`;
  return s;
}

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

/** Fallback chain: cache → curated */
async function serveFallback(svcClient: any): Promise<any> {
  // Try cache first
  try {
    const { data } = await svcClient
      .from("companion_cache")
      .select("id, content, used_count")
      .eq("companion_type", "signal")
      .eq("language", "en")
      .gte("quality_score", 2)
      .order("used_count", { ascending: true })
      .limit(5);
    if (data && data.length > 0) {
      const pick = data[Math.floor(Math.random() * data.length)];
      svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
      return pick.content;
    }
    // Try any quality
    const { data: anyQ } = await svcClient
      .from("companion_cache")
      .select("id, content, used_count")
      .eq("companion_type", "signal")
      .eq("language", "en")
      .order("used_count", { ascending: true })
      .limit(5);
    if (anyQ && anyQ.length > 0) {
      const pick = anyQ[Math.floor(Math.random() * anyQ.length)];
      svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
      return pick.content;
    }
  } catch { /* continue to curated */ }

  // Curated fallback — always works
  return CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const log = (msg: string) => console.log(`[signal] ${msg} (+${Date.now() - t0}ms)`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let body: any = {};
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid or empty request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { context, sources, recentSignalSources, recentSignalTitles } = body;
    log("parsed body");

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbClient = createClient(sbUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await sbClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    log("auth verified");

    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    svcClient.from("analytics_events").insert({ user_id: user.id, event: "signal_companion_ai_call" }).then(() => {});

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      log("missing API keys, serving fallback");
      const fallback = await serveFallback(svcClient);
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build source hints
    const sourceNames: string[] = [];
    const sourceUrls: string[] = [];
    if (sources && Array.isArray(sources)) {
      for (const s of sources) {
        if (s.name) sourceNames.push(s.name);
        if (s.url && typeof s.url === "string") {
          try {
            const hostname = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`).hostname.replace(/^www\./, "");
            if (hostname && !sourceUrls.includes(hostname)) sourceUrls.push(hostname);
          } catch { /* skip */ }
        }
      }
    }

    const recentExclusion = (recentSignalSources?.length > 0)
      ? ` Do NOT use insights from: ${recentSignalSources.slice(0, 5).join(", ")}. Pick a DIFFERENT thinker.`
      : "";
    const topicExclusion = (recentSignalTitles?.length > 0)
      ? `\nDo NOT cover these topics (already shown): ${recentSignalTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT angle.`
      : "";
    const sourceHint = sourceNames.length > 0
      ? ` Look for insights from sources like: ${sourceNames.sort(() => Math.random() - 0.5).slice(0, 5).join(", ")}.`
      : "";

    const searchQuery = context
      ? `Bitcoin philosophical perspective relevant when ${context}. Find a profound insight about conviction, patience, sound money, sovereignty, or long-term thinking from a respected Bitcoin thinker or writer.${sourceHint}${recentExclusion}`
      : `Find a profound, philosophical Bitcoin essay or insight about sovereignty, sound money, time preference, proof of work as philosophy, or the meaning of holding from a respected thinker.${sourceHint}${recentExclusion}`;

    const perplexityBody: any = {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `You are searching for deep, philosophical Bitcoin writing — essays and ideas that make a holder feel grounded in WHY they hold.

WHAT TO SEARCH FOR:
- Deep ideas about what Bitcoin represents for human freedom, sovereignty, and self-custody
- Philosophical perspectives on money, time preference, proof of work as a life principle
- Long-form thinking from Bitcoin writers, philosophers, economists
- Perspectives on sound money, Austrian economics, game theory, civilizational impact

WHAT TO AVOID:
- Price predictions, chart analysis, trading setups
- On-chain metrics, hash rate stats, exchange flows
- Short-term market commentary or news

IDEAL SOURCES: Bitcoin Magazine, Nakamoto Institute, Allen Farrington, Vijay Boyapati, Lyn Alden, Parker Lewis, Gigi, Robert Breedlove, Saifedean Ammous, Jeff Booth, Knut Svanholm

DIVERSITY: Use a DIFFERENT thinker every time. Prefer timeless essays over recent posts.${recentExclusion}${topicExclusion}`,
        },
        { role: "user", content: searchQuery },
      ],
      search_recency_filter: "year",
      ...(sourceUrls.length > 0 ? { search_domain_filter: sourceUrls.slice(0, 5) } : {}),
    };

    // ── Step 1: Perplexity search ──
    async function callPerplexity(pBody: any): Promise<{ content: string; citations: string[] }> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(pBody),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        log(`perplexity responded ${res.status}`);
        if (!res.ok) {
          const errText = await res.text();
          console.error("Perplexity error:", res.status, errText);
          if (res.status === 429) throw new Error("RATE_LIMITED");
          throw new Error("Perplexity search failed");
        }
        const data = await res.json();
        return { content: data.choices?.[0]?.message?.content || "", citations: data.citations || [] };
      } catch (e) {
        clearTimeout(timeout);
        throw e;
      }
    }

    log("calling perplexity");
    let searchContent = "";
    let citations: string[] = [];

    try {
      const result = await callPerplexity(perplexityBody);
      searchContent = result.content;
      citations = result.citations;
      log(`perplexity content length: ${searchContent.length}, citations: ${citations.length}`);

      // Retry without domain filter if no citations
      if (citations.length === 0 && sourceUrls.length > 0 && searchContent.length > 0) {
        log("0 citations with domain filter — retrying without filter");
        const retryBody = { ...perplexityBody };
        delete retryBody.search_domain_filter;
        try {
          const retry = await callPerplexity(retryBody);
          if (retry.citations.length > 0) {
            searchContent = retry.content;
            citations = retry.citations;
            log(`retry got ${citations.length} citations`);
          }
        } catch { log("retry failed, using original content"); }
      }
    } catch (e) {
      log(`perplexity failed: ${e}`);
      const fallback = await serveFallback(svcClient);
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!searchContent) {
      const fallback = await serveFallback(svcClient);
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Step 2: AI structuring ──
    const citationList = citations.length > 0
      ? citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")
      : "(No citations available — leave url empty)";

    log("calling AI structuring");

    const aiBody = {
      messages: [
        {
          role: "system",
          content: `Extract ONE philosophical Bitcoin insight from the search results below.

TONE: Profound, calm, grounding. Like a wise friend reminding you why you hold.
TITLE: Evocative, poetic, 5-10 words. Should read like a book chapter title, not a headline.
BODY: 2-3 sentences capturing the philosophical ESSENCE — not a summary. Distill the core idea.

GOOD TITLES: "Proof of work is proof of sacrifice" / "Sound money teaches patience before wealth" / "Sovereignty begins with what you refuse to delegate"
BAD TITLES: "Bitcoin hash rate reaches new high" / "Analyst predicts BTC target" / anything with numbers or dates

ACCURACY RULES (CRITICAL):
- Attribute ideas to the correct thinker from the search results
- Do NOT invent quotes or misattribute ideas
- The body distills the philosophical point — no data regurgitation

URL RULES (CRITICAL):
- Pick a url from the citation list below. Copy it character-for-character.
- If none match, use the FIRST citation URL.
- If no citations exist, set url to "".
- NEVER fabricate URLs.`,
        },
        {
          role: "user",
          content: `Search results:\n${searchContent}\n\nCitation URLs (pick one EXACTLY):\n${citationList}`,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_signal",
          description: "Return a single philosophical Bitcoin insight",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Evocative 5-10 word philosophical headline" },
              body: { type: "string", description: "2-3 sentences capturing the philosophical essence" },
              source: { type: "string", description: "Thinker, writer, or publication name" },
              url: { type: "string", description: "Citation URL copied character-for-character" },
            },
            required: ["title", "body", "source", "url"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_signal" } },
      temperature: 0.5,
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
    let signal: any = null;

    // Timeout budget: 8s primary + 6s fallback (10s Perplexity + 14s AI = 24s total)
    const AI_TIMEOUTS = [8000, 6000];
    for (let idx = 0; idx < models.length; idx++) {
      const model = models[idx];
      const aiController = new AbortController();
      const aiTimeout = setTimeout(() => aiController.abort(), AI_TIMEOUTS[idx]);
      try {
        const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...aiBody, model }),
          signal: aiController.signal,
        });
        clearTimeout(aiTimeout);
        log(`AI ${model} responded ${structureResponse.status}`);

        if (!structureResponse.ok) {
          await structureResponse.text();
          if (model !== models[models.length - 1]) { log("Retrying with fallback model"); continue; }
          break;
        }

        const structureData = await structureResponse.json();
        const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];
        const content = toolCall?.function?.arguments || structureData.choices?.[0]?.message?.content;
        if (!content) {
          if (model !== models[models.length - 1]) continue;
          break;
        }

        try {
          signal = typeof content === "string" ? JSON.parse(content) : content;
        } catch {
          const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
          if (m) signal = JSON.parse(m[0]);
          else if (model !== models[models.length - 1]) continue;
          else break;
        }
        break;
      } catch (e) {
        clearTimeout(aiTimeout);
        if (model !== models[models.length - 1]) { log(`${model} failed, retrying`); continue; }
        break;
      }
    }

    // If AI structuring failed entirely → fallback
    if (!signal || !signal.title || !signal.body) {
      log("AI structuring failed, serving fallback");
      const fallback = await serveFallback(svcClient);
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Post-processing: URL validation ──
    const aiUrl = signal.url || "";
    const exactMatch = citations.find((c) => c === aiUrl);
    if (exactMatch) {
      signal.url = exactMatch;
    } else {
      try {
        const partialMatch = aiUrl ? citations.find((c) => c.includes(new URL(normalizeUrl(aiUrl)).hostname)) : null;
        signal.url = partialMatch || (citations.length > 0 ? citations[0] : "");
      } catch {
        signal.url = citations.length > 0 ? citations[0] : "";
      }
    }

    if (signal.url && !signal.url.startsWith("http")) {
      signal.url = normalizeUrl(signal.url);
    }

    let qualityScore = 1;
    if (signal.url) {
      const reachable = await isUrlReachable(signal.url);
      if (!reachable) {
        let found = false;
        for (const c of citations) {
          if (c !== signal.url && await isUrlReachable(c)) {
            signal.url = c;
            found = true;
            break;
          }
        }
        if (!found) {
          const searchTerm = encodeURIComponent(signal.source || signal.title || "Bitcoin philosophy sound money sovereignty");
          signal.url = `https://www.google.com/search?q=${searchTerm}`;
        }
      } else {
        qualityScore = 2;
      }
    }

    // ── Quality gate: reject low-quality before returning ──
    const hasNumbers = /\d{2,}%|\$\d/.test(signal.body);
    const tooShort = (signal.body?.length || 0) < 40;
    if (hasNumbers || tooShort) {
      log(`quality gate failed: hasNumbers=${hasNumbers} tooShort=${tooShort}`);
      qualityScore = 0; // Don't cache
      // Still return it but don't cache low-quality
    }

    // Cache good content with title-based dedup
    if (signal.title && signal.body && signal.source && qualityScore > 0) {
      (async () => {
        try {
          const { data: existing } = await svcClient.from("companion_cache").select("content").eq("companion_type", "signal").eq("language", "en").limit(30);
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
          const newNorm = norm(signal.title);
          const isDup = existing?.some((e: any) => {
            const t = norm(e.content?.title || "");
            return t === newNorm || t.includes(newNorm) || newNorm.includes(t);
          });
          if (!isDup) {
            await svcClient.from("companion_cache").insert({ companion_type: "signal", language: "en", content: signal, quality_score: qualityScore });
          } else { log("cache dedup: skipped duplicate title"); }
        } catch { /* non-fatal */ }
      })();
    }

    log(`done, signal: ${signal.title}, source: ${signal.source}`);
    return new Response(JSON.stringify(signal), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signal-companion error:", e);
    // Final safety net: curated fallback
    try {
      const fallback = CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)];
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
});
