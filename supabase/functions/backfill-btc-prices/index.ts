import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { holzenEdgeError, holzenEdgeRun, holzenEdgeWarn } from "../_shared/holzen-edge-log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Max calendar days per invocation (edge timeout + CoinGecko limits). Run again with the next window. */
const MAX_DAYS_PER_RUN = 120;
const DEFAULT_CHUNK_DAYS = 45;
const COINGECKO_GAP_MS = 3000;
const MATCH_WINDOW_MS = 48 * 3600 * 1000;

function parseDateKey(s: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, mo, d] = s.split("-").map(Number);
  const ms = Date.UTC(y, mo - 1, d);
  if (!Number.isFinite(ms)) return null;
  const roundTrip = new Date(ms).toISOString().slice(0, 10);
  if (roundTrip !== s) return null;
  return ms;
}

function addUtcDays(ms: number, days: number): number {
  return ms + days * 86400000;
}

function toDateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function enumerateUtcDays(fromMs: number, toMs: number): string[] {
  const keys: string[] = [];
  for (let ms = fromMs; ms <= toMs; ms = addUtcDays(ms, 1)) {
    keys.push(toDateKey(ms));
  }
  return keys;
}

function closestPriceForTarget(
  prices: [number, number][],
  targetMs: number,
): { price: number; dist: number } | null {
  let closest: [number, number] | null = null;
  let closestDist = Infinity;
  for (const [ts, price] of prices) {
    const dist = Math.abs(ts - targetMs);
    if (dist < closestDist) {
      closestDist = dist;
      closest = [ts, price];
    }
  }
  if (!closest || closestDist >= MATCH_WINDOW_MS) return null;
  return { price: Math.round(closest[1]), dist: closestDist };
}

/**
 * Manual / ops: backfill `btc_price_cache` for a UTC date range using CoinGecko
 * `market_chart/range` (same nearest-sample idea as `refresh-btc-prices`).
 *
 * **Auth:** service role JWT or `CRON_SECRET` (same as other cron workers).
 *
 * **Body (JSON):**
 * - `from` / `to`: `YYYY-MM-DD`, inclusive, UTC calendar dates.
 * - `onlyMissing` (optional, default `true`): skip dates that already exist in the table.
 * - `dryRun` (optional, default `false`): compute rows but do not upsert.
 * - `chunkDays` (optional, default 45): CoinGecko window size per HTTP call.
 *
 * At most **120** days per call; run multiple invocations for longer spans.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();

  try {
    holzenEdgeRun("backfill-btc", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("backfill-btc", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("backfill-btc", "auth ok");

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST required" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(await req.text() || "{}") as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromRaw = body.from;
    const toRaw = body.to;
    if (typeof fromRaw !== "string" || typeof toRaw !== "string") {
      return new Response(JSON.stringify({ error: "Body must include string from and to (YYYY-MM-DD)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromMs = parseDateKey(fromRaw);
    const toMs = parseDateKey(toRaw);
    if (fromMs === null || toMs === null) {
      return new Response(JSON.stringify({ error: "from and to must be valid UTC calendar dates YYYY-MM-DD" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fromMs > toMs) {
      return new Response(JSON.stringify({ error: "from must be <= to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dayCount = Math.floor((toMs - fromMs) / 86400000) + 1;
    if (dayCount > MAX_DAYS_PER_RUN) {
      return new Response(
        JSON.stringify({
          error: `Range too large (${dayCount} days). Max ${MAX_DAYS_PER_RUN} days per call; split the range.`,
          maxDaysPerRun: MAX_DAYS_PER_RUN,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const onlyMissing = body.onlyMissing !== false;
    const dryRun = body.dryRun === true;
    const chunkDays = typeof body.chunkDays === "number" && body.chunkDays > 0 && body.chunkDays <= 90
      ? Math.floor(body.chunkDays)
      : DEFAULT_CHUNK_DAYS;

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey,
      { auth: { persistSession: false } },
    );

    let allKeys = enumerateUtcDays(fromMs, toMs);

    if (onlyMissing) {
      const { data: existing, error: selErr } = await supabase
        .from("btc_price_cache")
        .select("date")
        .gte("date", fromRaw)
        .lte("date", toRaw);
      if (selErr) {
        holzenEdgeError("backfill-btc", "select existing dates failed", selErr);
        return new Response(JSON.stringify({ error: "Failed to read existing cache rows" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const have = new Set((existing ?? []).map((r: { date: string }) => r.date));
      allKeys = allKeys.filter((k) => !have.has(k));
    }

    if (allKeys.length === 0) {
      holzenEdgeRun("backfill-btc", "run complete", {
        ms: Date.now() - t0,
        summary: "nothing to do (all dates present or empty range)",
      });
      return new Response(
        JSON.stringify({
          success: true,
          from: fromRaw,
          to: toRaw,
          onlyMissing,
          dryRun,
          daysTargeted: 0,
          daysUpserted: 0,
          chunks: 0,
          rateLimited: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let daysUpserted = 0;
    let chunks = 0;
    let abortReason: string | null = null;

    for (let i = 0; i < allKeys.length; i += chunkDays) {
      const slice = allKeys.slice(i, i + chunkDays);
      const chunkStartMs = parseDateKey(slice[0]!)!;
      const chunkEndMs = parseDateKey(slice[slice.length - 1]!)!;
      const fromSec = Math.floor((chunkStartMs - 86400000) / 1000);
      const toSec = Math.floor((chunkEndMs + 86400000) / 1000);

      chunks++;
      if (chunks > 1) await new Promise((r) => setTimeout(r, COINGECKO_GAP_MS));

      const url =
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${fromSec}&to=${toSec}`;
      const res = await fetch(url);

      if (res.status === 429) {
        holzenEdgeWarn("backfill-btc", "CoinGecko rate limited", { chunk: chunks });
        abortReason = "rate_limited";
        break;
      }
      if (!res.ok) {
        holzenEdgeWarn("backfill-btc", "CoinGecko non-OK", { status: res.status, chunk: chunks });
        abortReason = `coingecko_http_${res.status}`;
        break;
      }

      const data = await res.json();
      const prices: [number, number][] = data?.prices || [];
      if (prices.length === 0) {
        holzenEdgeWarn("backfill-btc", "empty prices array", { chunk: chunks });
        abortReason = "empty_prices";
        break;
      }

      const fetchedAt = new Date().toISOString();
      const inserts: { date: string; price: number; fetched_at: string }[] = [];

      for (const dateKey of slice) {
        const targetMs = parseDateKey(dateKey);
        if (targetMs === null) continue;
        const hit = closestPriceForTarget(prices, targetMs);
        if (hit) inserts.push({ date: dateKey, price: hit.price, fetched_at: fetchedAt });
      }

      if (!dryRun && inserts.length > 0) {
        const { error: upErr } = await supabase.from("btc_price_cache").upsert(inserts);
        if (upErr) {
          holzenEdgeError("backfill-btc", "upsert failed", upErr);
          return new Response(JSON.stringify({ error: "Upsert failed", detail: String(upErr) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      daysUpserted += inserts.length;
    }

    const summary = abortReason
      ? `partial: ${daysUpserted} rows, ${chunks} chunks, stopped=${abortReason}`
      : `upserted ${daysUpserted} rows, ${chunks} chunks${dryRun ? " (dryRun)" : ""}`;
    holzenEdgeRun("backfill-btc", "run complete", { ms: Date.now() - t0, summary });

    return new Response(
      JSON.stringify({
        success: abortReason === null,
        from: fromRaw,
        to: toRaw,
        onlyMissing,
        dryRun,
        daysTargeted: allKeys.length,
        daysUpserted,
        chunks,
        abortReason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    holzenEdgeError("backfill-btc", "uncaught error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
