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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Support both user JWT and service role key auth
    let resolvedUserId: string | null = null;
    const token = authHeader.replace("Bearer ", "");
    if (token === serviceRoleKey) {
      // Called server-to-server; userId must be in the body
    } else {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) throw new Error("Not authenticated");
      resolvedUserId = claimsData.claims.sub as string;
    }

    const { context, reflectionMessage, language, userId: bodyUserId } = await req.json();
    const effectiveUserId = resolvedUserId || bodyUserId;

    // Track AI usage
    if (effectiveUserId) {
      try { await serviceClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "zoom_out_ai_call" }); } catch (_) { /* non-fatal */ }
    }

    // --- 1. Fetch "on this day" BTC prices with DB caching ---
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();

    // Build date keys for years 1-4 ago
    const yearTargets = [1, 2, 3, 4].map(y => {
      const d = new Date(Date.UTC(currentYear - y, month, day));
      return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10), ts: Math.floor(d.getTime() / 1000) };
    });

    // Check cache first
    const dateKeys = yearTargets.map(t => t.dateKey);
    const { data: cached } = await serviceClient
      .from("btc_price_cache")
      .select("date, price")
      .in("date", dateKeys);

    const cachedMap = new Map((cached || []).map((r: any) => [r.date, r.price]));
    const missingTargets = yearTargets.filter(t => !cachedMap.has(t.dateKey));

    let rateLimited = false;
    console.log(`[zoom-out] cache hit: ${cachedMap.size}/${yearTargets.length}, fetching ${missingTargets.length} from CoinGecko`);

    // Fetch missing prices with a SINGLE batched CoinGecko call spanning the full range
    const newPrices: { date: string; price: number }[] = [];
    if (missingTargets.length > 0) {
      // Use the earliest and latest missing dates to define one range
      const timestamps = missingTargets.map(t => t.ts);
      const from = Math.min(...timestamps) - 86400;
      const to = Math.max(...timestamps) + 86400;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (res.status === 429) {
          console.warn(`[zoom-out] CoinGecko 429 on batched call`);
          await res.text();
          rateLimited = true;
        } else if (res.ok) {
          const json = await res.json();
          const prices: [number, number][] = json?.prices || [];

          // For each missing target, find the closest data point
          for (const target of missingTargets) {
            const targetMs = target.ts * 1000;
            let closest: [number, number] | null = null;
            let closestDist = Infinity;

            for (const [ts, price] of prices) {
              const dist = Math.abs(ts - targetMs);
              if (dist < closestDist) {
                closestDist = dist;
                closest = [ts, price];
              }
            }

            // Accept if within 48h of target date
            if (closest && closestDist < 48 * 3600 * 1000) {
              newPrices.push({ date: target.dateKey, price: Math.round(closest[1]) });
            }
          }
        } else {
          await res.text();
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          console.warn(`[zoom-out] CoinGecko timeout on batched call`);
        }
      }
    }

    // Cache new prices (fire-and-forget via service role)
    if (newPrices.length > 0) {
      serviceClient
        .from("btc_price_cache")
        .upsert(newPrices.map(p => ({ date: p.date, price: p.price, fetched_at: new Date().toISOString() })))
        .then(({ error }) => { if (error) console.warn("[zoom-out] cache write failed:", error.message); });
    }

    // Combine cached + freshly fetched
    const onThisDay: { yearsAgo: number; price: number; date: string }[] = [];
    for (const target of yearTargets) {
      const cachedPrice = cachedMap.get(target.dateKey);
      const fresh = newPrices.find(p => p.date === target.dateKey);
      const price = cachedPrice ?? fresh?.price;
      if (price) onThisDay.push({ yearsAgo: target.yearsAgo, date: target.dateKey, price: Math.round(price) });
    }

    // Current price — single lightweight call
    let currentPrice: number | null = null;
    if (!rateLimited) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          currentPrice = json?.bitcoin?.usd ? Math.round(json.bitcoin.usd) : null;
        } else {
          if (res.status === 429) rateLimited = true;
          await res.text();
        }
      } catch { /* ignore */ }
    }

    // Fallback: extract price from context string (e.g. "BTC is down 3.8% · $71,141")
    if (!currentPrice && context) {
      const priceMatch = context.match(/\$[\d,]+/);
      if (priceMatch) {
        const parsed = parseInt(priceMatch[0].replace(/[$,]/g, ''), 10);
        if (parsed > 0) currentPrice = parsed;
      }
    }

    // --- 2. Fetch a real past reflection for "echo" ---
    let echoReflection: { message: string; created_at: string; mood: string | null; outcome: string | null } | null = null;
    if (effectiveUserId) {
      try {
        const direction = context?.toLowerCase().includes("is down") ? "down" : context?.toLowerCase().includes("is up") ? "up" : null;

        if (direction) {
          const { data } = await serviceClient
            .from("reflections")
            .select("message, created_at, mood, outcome, context")
            .eq("user_id", effectiveUserId)
            .not("outcome", "is", null)
            .lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
            .order("created_at", { ascending: false })
            .limit(50);

          if (data && data.length > 0) {
            const matching = data.filter((r: any) => {
              if (direction === "down") return r.context?.toLowerCase().includes("is down");
              return r.context?.toLowerCase().includes("is up");
            });
            const pool = matching.length > 0 ? matching : data;
            echoReflection = pool[Math.floor(Math.random() * Math.min(pool.length, 10))] as any;
          }
        } else {
          const { data } = await serviceClient
            .from("reflections")
            .select("message, created_at, mood, outcome")
            .eq("user_id", effectiveUserId)
            .not("outcome", "is", null)
            .lt("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
            .order("created_at", { ascending: false })
            .limit(10);

          if (data && data.length > 0) {
            echoReflection = data[0] as any;
          }
        }
      } catch (e) {
        console.warn("[zoom-out] echo fetch failed:", e);
      }
    }

    // --- 3. Generate deep-time perspective via AI ---
    let deepTime: { title: string; body: string } | null = null;
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
        const langCode = language || "en";
        const langName = LANG_NAMES[langCode] || "English";
        const langInstruction = langCode !== "en" ? `CRITICAL LANGUAGE REQUIREMENT: You MUST write title and body in ${langName}.\n\n` : "";

        const priceContext = currentPrice ? `Current BTC price: $${currentPrice.toLocaleString()}.` : "";
        const historyContext = onThisDay.length > 0
          ? `BTC prices on this day: ${onThisDay.map(e => `${e.yearsAgo}y ago: $${e.price.toLocaleString()}`).join(", ")}.`
          : "";

        const systemPrompt = `${langInstruction}You generate ONE deep-time perspective for a Bitcoin mindfulness app. Your job is to zoom way out — beyond markets, beyond decades — into civilizational, planetary, or epochal timescales.

Think like the Long Now Foundation. Think in centuries and millennia. Put today's price movement in the context of:
- Human civilization's relationship with money (shells, gold, paper, digital)
- Technological adoption curves (printing press: 50 years to transform Europe; internet: 30 years to connect the world)
- Planetary facts (Earth is 4.5B years old; modern humans: 300,000 years; agriculture: 10,000 years)
- The scale of Bitcoin (15 years old in a 5,000-year history of money)
- Deep time numbers (total gold ever mined, world population at BTC genesis vs now, global debt, energy from the sun)

Rules:
- Title: a short, evocative phrase (3-8 words). Not a sentence.
- Body: 1-2 sentences. Poetic but factual. Should make the reader feel the smallness of today's price move against deep time.
- No trading advice, no price predictions, no exclamation marks.
- Vary the theme: sometimes civilizational, sometimes planetary, sometimes about the nature of patience itself.
- Ground in real facts and numbers when possible.

You MUST respond with a JSON object containing "title" and "body" keys. No other text.`;

        const aiBody = {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${context || "BTC is moving today."} ${priceContext} ${historyContext}` },
          ],
          response_format: { type: "json_object" },
        };

        const models = ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash"];
        for (const model of models) {
          const aiController = new AbortController();
          const aiTimeout = setTimeout(() => aiController.abort(), 18000);
          try {
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
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
                  if (parsed.title && parsed.body) {
                    deepTime = { title: parsed.title, body: parsed.body };
                    break;
                  }
                } catch {
                  console.warn(`[zoom-out] Failed to parse AI JSON from ${model}:`, raw?.slice?.(0, 200));
                  if (model !== models[models.length - 1]) continue;
                }
              } else if (model !== models[models.length - 1]) continue;
            } else {
              await aiRes.text();
              if (model !== models[models.length - 1]) continue;
            }
          } catch (e) {
            clearTimeout(aiTimeout);
            if (e instanceof DOMException && e.name === "AbortError") {
              console.warn(`[zoom-out] AI ${model} timed out`);
              if (model !== models[models.length - 1]) continue;
            } else {
              throw e;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Deep time generation failed:", e);
    }

    // --- 4. Build response ---
    const isPartial = rateLimited || onThisDay.length < yearTargets.length;
    if (isPartial) {
      console.log(`[zoom-out] returning partial data: ${onThisDay.length}/${yearTargets.length} prices, rateLimited=${rateLimited}, currentPrice=${currentPrice ?? 'fallback'}`);
    }

    const result = {
      onThisDay,
      currentPrice,
      echo: echoReflection
        ? {
            message: echoReflection.message,
            created_at: echoReflection.created_at,
            mood: echoReflection.mood,
            outcome: echoReflection.outcome,
          }
        : null,
      deepTime,
      partial: isPartial,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("zoom-out error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});