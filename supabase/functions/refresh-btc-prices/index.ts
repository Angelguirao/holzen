import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { holzenEdgeError, holzenEdgeRun, holzenEdgeWarn } from "../_shared/holzen-edge-log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Background BTC price refresh.
 *
 * Scheduled via cron every ~15 minutes (see docs/ops/cron-setup.md). Fetches:
 * 1. Current BTC price (USD)
 * 2. Historical prices for "on this day" (1-4 years ago)
 *
 * Stores everything in btc_price_cache. The zoom-out companion reads ONLY from this
 * cache during sessions (no CoinGecko at user time).
 *
 * **Freshness contract (product):** Historical rows for the four anniversary dates are
 * refetched when `fetched_at` is older than **24h** or missing. Dates are **UTC calendar**
 * (year/month/day). This is accurate enough for **daily Zoom Out metaphor**, not intraday
 * trading. After a missed cron, staleness is bounded by the next successful run + TTL.
 *
 * **CoinGecko:** two calls per run when historical work is needed (simple price, then
 * `market_chart/range`). Default **2s** gap between them; if the first returns **429**,
 * the gap widens to **12s** before the second call to reduce back-to-back rate limits.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();

  try {
    holzenEdgeRun("refresh-btc", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("refresh-btc", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    holzenEdgeRun("refresh-btc", "auth ok");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey,
      { auth: { persistSession: false } },
    );

    const results: string[] = [];
    /** Longer pause before second CoinGecko call if the first was rate-limited. */
    let coingeckoInterCallMs = 2000;

    // ── 1. Fetch current price ──
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      if (res.ok) {
        const data = await res.json();
        const price = data?.bitcoin?.usd;
        if (price) {
          const today = new Date().toISOString().slice(0, 10);
          const { error: upErr } = await supabase.from("btc_price_cache").upsert({
            date: today,
            price: Math.round(price),
            fetched_at: new Date().toISOString(),
          });
          if (upErr) {
            holzenEdgeError("refresh-btc", "current price upsert failed", upErr);
            results.push("current: upsert failed");
          } else {
            results.push(`current: $${Math.round(price)}`);
          }
        } else {
          holzenEdgeWarn("refresh-btc", "current price: OK response but missing bitcoin.usd");
          results.push("current: no price in JSON");
        }
      } else if (res.status === 429) {
        holzenEdgeWarn("refresh-btc", "CoinGecko rate limited for current price");
        coingeckoInterCallMs = 12000; // reduce immediate second 429 on market_chart/range
        // Try backup: Blockchain.info
        try {
          const backupRes = await fetch("https://blockchain.info/ticker");
          if (backupRes.ok) {
            const data = await backupRes.json();
            const price = data?.USD?.last;
            if (price) {
              const today = new Date().toISOString().slice(0, 10);
              const { error: upErr } = await supabase.from("btc_price_cache").upsert({
                date: today,
                price: Math.round(price),
                fetched_at: new Date().toISOString(),
              });
              if (upErr) {
                holzenEdgeError("refresh-btc", "current price (backup) upsert failed", upErr);
                results.push("current (backup): upsert failed");
              } else {
                results.push(`current (backup): $${Math.round(price)}`);
              }
            } else {
              results.push("current (backup): no USD last");
            }
          }
        } catch { /* backup also failed */ }
      } else {
        holzenEdgeWarn("refresh-btc", "current price: CoinGecko non-OK", { status: res.status });
        results.push(`current: HTTP ${res.status}`);
      }
    } catch (e) {
      holzenEdgeError("refresh-btc", "current price fetch error", e);
    }

    await new Promise((r) => setTimeout(r, coingeckoInterCallMs));

    // ── 2. Fetch historical "on this day" prices (1-4 years ago) ──
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();

    const yearTargets = [1, 2, 3, 4].map(y => {
      const d = new Date(Date.UTC(currentYear - y, month, day));
      return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10), ts: Math.floor(d.getTime() / 1000) };
    });

    // Check which dates we already have cached (skip if recently fetched)
    const dateKeys = yearTargets.map(t => t.dateKey);
    const { data: cached } = await supabase.from("btc_price_cache").select("date, fetched_at").in("date", dateKeys);
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h
    const recentlyFetched = new Set(
      (cached ?? []).filter((r: any) => r.fetched_at > recentThreshold).map((r: any) => r.date),
    );

    const missingTargets = yearTargets.filter(t => !recentlyFetched.has(t.dateKey));

    if (missingTargets.length > 0) {
      const timestamps = missingTargets.map(t => t.ts);
      const from = Math.min(...timestamps) - 86400;
      const to = Math.max(...timestamps) + 86400;

      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`);
        if (res.ok) {
          const data = await res.json();
          const prices: [number, number][] = data?.prices || [];

          const inserts: { date: string; price: number; fetched_at: string }[] = [];
          for (const target of missingTargets) {
            const targetMs = target.ts * 1000;
            let closest: [number, number] | null = null;
            let closestDist = Infinity;
            for (const [ts, price] of prices) {
              const dist = Math.abs(ts - targetMs);
              if (dist < closestDist) { closestDist = dist; closest = [ts, price]; }
            }
            if (closest && closestDist < 48 * 3600 * 1000) {
              inserts.push({ date: target.dateKey, price: Math.round(closest[1]), fetched_at: new Date().toISOString() });
            }
          }

          if (inserts.length > 0) {
            const { error: upErr } = await supabase.from("btc_price_cache").upsert(inserts);
            if (upErr) {
              holzenEdgeError("refresh-btc", "historical upsert failed", upErr);
              results.push("historical: upsert failed");
            } else {
              results.push(`historical: ${inserts.length}/${missingTargets.length} prices cached`);
            }
          } else {
            holzenEdgeWarn("refresh-btc", "historical: no rows matched range", {
              missing: missingTargets.length,
              coingecko_points: prices.length,
            });
            results.push(`historical: 0 matched (${missingTargets.length} needed, ${prices.length} points)`);
          }
        } else if (res.status === 429) {
          holzenEdgeWarn("refresh-btc", "CoinGecko rate limited for historical prices");
          results.push("historical: rate limited");
        } else {
          holzenEdgeWarn("refresh-btc", "historical: CoinGecko non-OK", { status: res.status });
          results.push(`historical: HTTP ${res.status}`);
        }
      } catch (e) {
        holzenEdgeError("refresh-btc", "historical price fetch error", e);
      }
    } else {
      results.push("historical: all cached within 24h");
    }

    const summary = results.length > 0 ? results.join("; ").slice(0, 500) : "no steps recorded";
    // Always emit completion so operators see current vs historical outcome when HOLZEN_EDGE_LOG=0.
    holzenEdgeRun("refresh-btc", "run complete", { ms: Date.now() - t0, summary });
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    holzenEdgeError("refresh-btc", "uncaught error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
