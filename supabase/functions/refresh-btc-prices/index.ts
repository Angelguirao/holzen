import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { unknownErrorForLog } from "../_shared/log-unknown-error.ts";
import { btcOnThisDayYearOffsets } from "../_shared/btc-on-this-day-config.ts";
import { coingeckoHeaders } from "../_shared/coingecko.ts";
import { warmMissingBtcPrices } from "../_shared/btc-price-warm.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Background BTC price refresh.
 *
 * Scheduled via cron every ~15 minutes (see docs/ops/cron-setup.md). Fetches:
 * 1. Current BTC price (USD)
 * 2. Historical prices for "on this day" (1–N calendar years ago; see btc-on-this-day-config)
 *
 * Stores everything in btc_price_cache. The zoom-out companion reads ONLY from this
 * cache during sessions (no CoinGecko at user time).
 *
 * **Freshness contract (product):** Historical rows for each anniversary date (1y..Ny ago) are
 * fetched **once and never refreshed** — a closing price for a past UTC date is immutable, so
 * re-fetching it is a pure cost with no product benefit. Today's row refreshes every run via
 * `/simple/price`. Dates are **UTC calendar** (year/month/day). This is accurate enough for
 * **daily Zoom Out metaphor**, not intraday trading. After a missed cron, today's row is stale
 * until the next successful run; historical rows are unaffected.
 *
 * **CoinGecko:** uses `/simple/price` for the current day and `/coins/bitcoin/history`
 * once per missing anniversary date for history. The per-date `/history` endpoint
 * works on the **free / demo** tier for any historical date; the previous
 * `/market_chart/range` approach silently capped at ~365 days back on free tier
 * and left anniversary rows 2+ years old empty ("historical=0/10" in zoom-out
 * logs). Historical fills now run through the shared `warmMissingBtcPrices`
 * helper with bounded parallelism (default concurrency 5 with 1.2s between
 * batches), so 10 anniversary dates finish in ~2-3s instead of the previous
 * ~10s sequential loop, while still staying well under the ~30 req/min demo
 * quota. The same helper powers the session-side warm-on-read path in
 * `zoom-out.ts` so both paths share dedupe + concurrency semantics.
 */

serve(
  withRequestLogging("refresh-btc-prices", async ({ req, log }) => {
  const t0 = Date.now();

  try {
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      log.warn("refresh_btc_phase", {
        holzen_event: "refresh_btc_cron",
        phase: "service_auth_rejected",
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    log("refresh_btc_phase", {
      holzen_event: "refresh_btc_cron",
      phase: "service_auth_ok",
    });

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
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { headers: coingeckoHeaders() });
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
            log.error("refresh_btc_current", {
              holzen_event: "refresh_btc_cron",
              phase: "current_upsert_failed",
              ...unknownErrorForLog(upErr),
            });
            results.push("current: upsert failed");
          } else {
            results.push(`current: $${Math.round(price)}`);
          }
        } else {
          log.warn("refresh_btc_current", {
            holzen_event: "refresh_btc_cron",
            phase: "current_missing_bitcoin_usd",
          });
          results.push("current: no price in JSON");
        }
      } else if (res.status === 429) {
        log.warn("refresh_btc_current", {
          holzen_event: "refresh_btc_cron",
          phase: "coingecko_rate_limited_current",
        });
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
                log.error("refresh_btc_current", {
                  holzen_event: "refresh_btc_cron",
                  phase: "current_backup_upsert_failed",
                  ...unknownErrorForLog(upErr),
                });
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
        log.warn("refresh_btc_current", {
          holzen_event: "refresh_btc_cron",
          phase: "coingecko_non_ok",
          http_status: res.status,
        });
        results.push(`current: HTTP ${res.status}`);
      }
    } catch (e) {
      log.error("refresh_btc_current", {
        holzen_event: "refresh_btc_cron",
        phase: "current_fetch_error",
        ...unknownErrorForLog(e),
      });
    }

    await new Promise((r) => setTimeout(r, coingeckoInterCallMs));

    // ── 2. Fetch historical "on this day" prices (1..N years ago, UTC) ──
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const day = today.getUTCDate();

    const yearTargets = btcOnThisDayYearOffsets().map((y) => {
      const d = new Date(Date.UTC(currentYear - y, month, day));
      return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10), ts: Math.floor(d.getTime() / 1000) };
    });

    // Skip anniversary dates that already have a row in the cache. Historical
    // BTC prices for past UTC calendar dates are **immutable** — once we've
    // successfully cached the closing price for 2018-04-19, that value never
    // changes, so there's no reason to re-fetch it. The old 24h-TTL behaviour
    // burned CoinGecko quota on every 15-min run trying to refresh rows that
    // wouldn't change, and since mid-2024 demo tier returns 401 for
    // /coins/bitcoin/history on dates >365d back (see
    // docs/ops/cron-setup.md) the refetches were guaranteed to fail anyway.
    // Today's row refreshes via the /simple/price call above, which is the
    // right place for intraday updates — this list only covers 1y..Ny ago.
    const dateKeys = yearTargets.map((t) => t.dateKey);
    const { data: cached } = await supabase
      .from("btc_price_cache")
      .select("date")
      .in("date", dateKeys);
    const cachedRows = (cached ?? []) as { date: string }[];
    const alreadyCached = new Set(cachedRows.map((r) => r.date));
    const missingTargets = yearTargets.filter((t) => !alreadyCached.has(t.dateKey));

    if (missingTargets.length > 0) {
      try {
        const warm = await warmMissingBtcPrices(
          supabase,
          missingTargets.map((t) => t.dateKey),
        );
        if (warm.upserted > 0) {
          results.push(
            `historical: ${warm.upserted}/${missingTargets.length} prices cached` +
              (warm.rateLimited > 0 ? `, ${warm.rateLimited} rate-limited` : "") +
              (warm.other > 0 ? `, ${warm.other} other failures` : "") +
              (warm.skippedRecent > 0 ? `, ${warm.skippedRecent} skipped (recent)` : ""),
          );
        } else if (warm.skippedRecent === missingTargets.length) {
          results.push(`historical: all ${missingTargets.length} fetched <15min ago (skipped)`);
        } else {
          log.warn("refresh_btc_historical", {
            holzen_event: "refresh_btc_cron",
            phase: "historical_no_dates_resolved",
            missing: missingTargets.length,
            rate_limited: warm.rateLimited,
            other_failures: warm.other,
            skipped_recent: warm.skippedRecent,
          });
          results.push(
            `historical: 0/${missingTargets.length} matched` +
              (warm.rateLimited > 0 ? ` (${warm.rateLimited} rate-limited)` : ""),
          );
        }
      } catch (e) {
        log.error("refresh_btc_historical", {
          holzen_event: "refresh_btc_cron",
          phase: "historical_warm_failed",
          ...unknownErrorForLog(e),
        });
        results.push("historical: warm helper failed");
      }
    } else {
      results.push("historical: all cached within 24h");
    }

    const summary = results.length > 0 ? results.join("; ").slice(0, 500) : "no steps recorded";
    log("refresh_btc_complete", {
      holzen_event: "refresh_btc_cron",
      phase: "run_complete",
      ms: Date.now() - t0,
      summary,
    });
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("refresh_btc_uncaught", {
      holzen_event: "refresh_btc_cron",
      phase: "uncaught",
      ...unknownErrorForLog(e),
    });
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
