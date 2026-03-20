import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── CURATED DEEP TIME FALLBACKS ──
const CURATED_DEEP_TIME = [
  {
    title: "Fifteen years in five thousand",
    body: "Humans have used money for roughly 5,000 years — shells, salt, gold, paper, digits. Bitcoin is 15 years old. You're watching the first chapter of a new monetary epoch being written in real time.",
  },
  {
    title: "The patience of geology",
    body: "The Grand Canyon took 6 million years to carve. Today's price movement is a single grain of sand in that process. The forces shaping Bitcoin — cryptography, energy, mathematics — operate on timescales your portfolio screen cannot display.",
  },
  {
    title: "Gold took centuries to become gold",
    body: "For thousands of years, humans carried gold without knowing why it was valuable beyond its beauty. It took until 1717 for Isaac Newton to formally establish the gold standard. Monetary consensus is measured in centuries, not quarters.",
  },
  {
    title: "A technology adopted in the blink of history",
    body: "The printing press took 50 years to spread across Europe. The internet took 30 years to connect the world. Bitcoin has connected 200 million people in 15 years. You're living through the fastest monetary adoption in human history.",
  },
  {
    title: "The sun sends more energy in one hour",
    body: "The sun delivers more energy to Earth in a single hour than humanity uses in an entire year. Bitcoin's energy usage, often criticized, represents a rounding error against the cosmic backdrop. Perspective is a function of the frame you choose.",
  },
];

// ── BANNED AI-SLOP PHRASES ──
const BANNED_PHRASES = ["dive into", "game-changer", "paradigm shift", "revolutionary", "unprecedented", "navigate the", "in the world of", "it's worth noting", "at the end of the day", "moving forward", "leverage", "synergy", "ecosystem", "disruptive", "next-gen", "cutting-edge"];

const MIN_BODY_LENGTH = 60;

function containsSlop(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.some(p => lower.includes(p));
}

function passesDeepTimeQuality(dt: any): boolean {
  if (!dt?.title || !dt?.body) return false;
  if ((dt.body || "").length < MIN_BODY_LENGTH) return false;
  if (containsSlop(dt.body) || containsSlop(dt.title)) return false;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const t0 = Date.now();
  const log = (msg: string) => console.log(`[zoom-out] ${msg} (+${Date.now() - t0}ms)`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Auth: support both user JWT and service role key
    let resolvedUserId: string | null = null;
    const token = authHeader.replace("Bearer ", "");
    if (token === serviceRoleKey) {
      // server-to-server
    } else {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");
      resolvedUserId = user.id;
    }

    const { context, reflectionMessage, userId: bodyUserId, mood, recentTitles } = await req.json();
    const effectiveUserId = resolvedUserId || bodyUserId;

    if (effectiveUserId) {
      try { await serviceClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "zoom_out_ai_call" }); } catch (_) { /* non-fatal */ }
    }

    // Observability helper — fire-and-forget
    const trackObs = (event: string, meta?: Record<string, any>) => {
      if (!effectiveUserId) return;
      serviceClient.from("analytics_events").insert({
        user_id: effectiveUserId, event,
        metadata: { companion_type: "zoom_out", latency_ms: Date.now() - t0, ...meta },
      }).then(() => {});
    };

    // ── 1. Fetch historical BTC prices with DB caching ──
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();

    const yearTargets = [1, 2, 3, 4].map(y => {
      const d = new Date(Date.UTC(currentYear - y, month, day));
      return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10), ts: Math.floor(d.getTime() / 1000) };
    });

    const dateKeys = yearTargets.map(t => t.dateKey);
    const { data: cached } = await serviceClient.from("btc_price_cache").select("date, price").in("date", dateKeys);
    const cachedMap = new Map((cached || []).map((r: any) => [r.date, r.price]));
    const missingTargets = yearTargets.filter(t => !cachedMap.has(t.dateKey));

    let rateLimited = false;
    log(`cache hit: ${cachedMap.size}/${yearTargets.length}, fetching ${missingTargets.length}`);

    const newPrices: { date: string; price: number }[] = [];
    if (missingTargets.length > 0) {
      const timestamps = missingTargets.map(t => t.ts);
      const from = Math.min(...timestamps) - 86400;
      const to = Math.max(...timestamps) + 86400;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.status === 429) { await res.text(); rateLimited = true; }
        else if (res.ok) {
          const json = await res.json();
          const prices: [number, number][] = json?.prices || [];
          for (const target of missingTargets) {
            const targetMs = target.ts * 1000;
            let closest: [number, number] | null = null;
            let closestDist = Infinity;
            for (const [ts, price] of prices) {
              const dist = Math.abs(ts - targetMs);
              if (dist < closestDist) { closestDist = dist; closest = [ts, price]; }
            }
            if (closest && closestDist < 48 * 3600 * 1000) {
              newPrices.push({ date: target.dateKey, price: Math.round(closest[1]) });
            }
          }
        } else { await res.text(); }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") log("CoinGecko timeout");
      }
    }

    if (newPrices.length > 0) {
      serviceClient.from("btc_price_cache").upsert(newPrices.map(p => ({ date: p.date, price: p.price, fetched_at: new Date().toISOString() }))).then(() => {});
    }

    const onThisDay: { yearsAgo: number; price: number; date: string }[] = [];
    for (const target of yearTargets) {
      const price = cachedMap.get(target.dateKey) ?? newPrices.find(p => p.date === target.dateKey)?.price;
      if (price) onThisDay.push({ yearsAgo: target.yearsAgo, date: target.dateKey, price: Math.round(price) });
    }

    // Current price
    let currentPrice: number | null = null;
    if (!rateLimited) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) { const json = await res.json(); currentPrice = json?.bitcoin?.usd ? Math.round(json.bitcoin.usd) : null; }
        else { if (res.status === 429) rateLimited = true; await res.text(); }
      } catch { /* ignore */ }
    }
    if (!currentPrice && context) {
      const priceMatch = context.match(/\$[\d,]+/);
      if (priceMatch) { const parsed = parseInt(priceMatch[0].replace(/[$,]/g, ''), 10); if (parsed > 0) currentPrice = parsed; }
    }

    // ── 2. Fetch past echo reflection ──
    let echoReflection: any = null;
    if (effectiveUserId) {
      try {
        const direction = context?.toLowerCase().includes("is down") ? "down" : context?.toLowerCase().includes("is up") ? "up" : null;
        if (direction) {
          const { data } = await serviceClient.from("reflections").select("message, created_at, mood, outcome, context").eq("user_id", effectiveUserId).not("outcome", "is", null).lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(50);
          if (data && data.length > 0) {
            const matching = data.filter((r: any) => direction === "down" ? r.context?.toLowerCase().includes("is down") : r.context?.toLowerCase().includes("is up"));
            const pool = matching.length > 0 ? matching : data;
            echoReflection = pool[Math.floor(Math.random() * Math.min(pool.length, 10))];
          }
        } else {
          const { data } = await serviceClient.from("reflections").select("message, created_at, mood, outcome").eq("user_id", effectiveUserId).not("outcome", "is", null).lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString()).order("created_at", { ascending: false }).limit(10);
          if (data && data.length > 0) echoReflection = data[0];
        }
      } catch (e) { log(`echo fetch failed: ${e}`); }
    }

    // ── 3. Generate deep-time perspective via AI ──
    let deepTime: { title: string; body: string } | null = null;
    let deepTimeSource = "none"; // Track source for observability
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      const priceContext = currentPrice ? `Current BTC price: $${currentPrice.toLocaleString()}.` : "";
      const historyContext = onThisDay.length > 0
        ? `BTC prices on this day: ${onThisDay.map(e => `${e.yearsAgo}y ago: $${e.price.toLocaleString()}`).join(", ")}.`
        : "";

      const titleExclusion = (recentTitles && Array.isArray(recentTitles) && recentTitles.length > 0)
        ? `\nDo NOT reuse these titles or topics (already shown): ${recentTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT perspective.`
        : "";

      const systemPrompt = `You generate ONE deep-time perspective for a Bitcoin mindfulness app. Zoom WAY out — beyond markets, beyond decades — into civilizational, planetary, or epochal timescales.

Think like the Long Now Foundation. Think in centuries and millennia. Context:
- Human civilization's 5,000-year relationship with money
- Technology adoption curves (printing press: 50 years; internet: 30 years)
- Planetary scale (Earth: 4.5B years; modern humans: 300,000 years; agriculture: 10,000 years)
- Bitcoin: 15 years old in a 5,000-year history of money

ACCURACY RULES (CRITICAL):
- Every number must be verifiable and widely accepted
- Prefer well-known facts over obscure claims
- Use approximate numbers when unsure ("roughly 300,000 years")

BANNED PHRASES — NEVER use any of these: ${BANNED_PHRASES.join(", ")}

FORMAT: JSON with "title" (3-8 word evocative phrase) and "body" (1-2 poetic but factual sentences).
No trading advice, no price predictions, no exclamation marks.${mood ? `\n\nUSER MOOD: The user is feeling "${mood}". Let this subtly inform which deep-time perspective you choose.` : ""}${titleExclusion}`;

      const aiBody = {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${context || "BTC is moving today."} ${priceContext} ${historyContext}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      };

      const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
      const AI_TIMEOUTS = [8000, 6000];
      for (let idx = 0; idx < models.length; idx++) {
        const model = models[idx];
        const aiController = new AbortController();
        const aiTimeout = setTimeout(() => aiController.abort(), AI_TIMEOUTS[idx]);
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ...aiBody, model }),
            signal: aiController.signal,
          });
          clearTimeout(aiTimeout);
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const raw = aiData.choices?.[0]?.message?.content;
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (parsed.title && parsed.body && passesDeepTimeQuality(parsed)) {
                  deepTime = { title: parsed.title, body: parsed.body };
                  deepTimeSource = "live";
                  // Cache with title-based dedup
                  (async () => {
                    try {
                      const { data: existing } = await serviceClient.from("companion_cache").select("content").eq("companion_type", "zoom_out_deep_time").eq("language", "en").limit(30);
                      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
                      const newNorm = norm(parsed.title);
                      const isDup = existing?.some((e: any) => { const t = norm(e.content?.title || ""); return t === newNorm || t.includes(newNorm) || newNorm.includes(t); });
                      if (!isDup) await serviceClient.from("companion_cache").insert({ companion_type: "zoom_out_deep_time", language: "en", content: deepTime, quality_score: 2 });
                    } catch { /* non-fatal */ }
                  })();
                  break;
                } else if (parsed.title && parsed.body) {
                  log(`deepTime quality gate failed: body=${(parsed.body||"").length}chars slop=${containsSlop(parsed.body||"")}`);
                  if (model !== models[models.length - 1]) continue;
                }
              } catch { if (model !== models[models.length - 1]) continue; }
            } else if (model !== models[models.length - 1]) continue;
          } else { await aiRes.text(); if (model !== models[models.length - 1]) continue; }
        } catch (e) {
          clearTimeout(aiTimeout);
          if (model !== models[models.length - 1]) continue;
        }
      }

      // Fallback chain: cache → curated
      if (!deepTime) {
        try {
          const { data: cachedDt } = await serviceClient.from("companion_cache").select("content, used_count, id").eq("companion_type", "zoom_out_deep_time").eq("language", "en").order("used_count", { ascending: true }).limit(5);
          if (cachedDt && cachedDt.length > 0) {
            const pick = cachedDt[Math.floor(Math.random() * cachedDt.length)];
            deepTime = pick.content as any;
            deepTimeSource = "cache";
            serviceClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
          }
        } catch { /* continue */ }

        if (!deepTime) {
          deepTime = CURATED_DEEP_TIME[Math.floor(Math.random() * CURATED_DEEP_TIME.length)];
          deepTimeSource = "curated";
        }
      }
    } else {
      deepTime = CURATED_DEEP_TIME[Math.floor(Math.random() * CURATED_DEEP_TIME.length)];
      deepTimeSource = "curated";
    }

    // Track deep-time observability
    if (deepTimeSource === "live") trackObs("companion_live_generated");
    else if (deepTimeSource === "cache") trackObs("companion_cache_hit");
    else if (deepTimeSource === "curated") trackObs("companion_fallback_curated");

    // ── 4. Build response ──
    const isPartial = rateLimited || onThisDay.length < yearTargets.length;
    const result = {
      onThisDay,
      currentPrice,
      echo: echoReflection ? { message: echoReflection.message, created_at: echoReflection.created_at, mood: echoReflection.mood, outcome: echoReflection.outcome } : null,
      deepTime,
      partial: isPartial,
    };

    log("done");
    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("zoom-out error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
