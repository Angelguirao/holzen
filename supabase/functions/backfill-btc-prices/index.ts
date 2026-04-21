import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { holzenEdgeError, holzenEdgeRun, holzenEdgeWarn } from "../_shared/holzen-edge-log.ts";
import { coingeckoHeaders, fetchCoinGeckoHistoryPrice } from "../_shared/coingecko.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Reject absurd typos (allows ~10y+ backfills in one logical range). */
const MAX_SPAN_DAYS = 4500;
const DEFAULT_CHUNK_DAYS = 45;
/** CoinGecko calls per HTTP invocation (edge wall-clock); continue with `resumeFrom` until `completed`. */
const DEFAULT_MAX_CHUNKS = 10;
const ABSOLUTE_MAX_CHUNKS = 25;
const COINGECKO_GAP_MS = 3000;
const PER_DATE_GAP_MS = 1000;
const MATCH_WINDOW_MS = 48 * 3600 * 1000;

/**
 * Hard cap per invocation when `mode: "per_date"` is in effect. 60 calls at
 * 1s spacing ≈ 60s wall-clock, comfortably under the edge-function timeout.
 */
const PER_DATE_MAX_CALLS = 60;

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
 * - `mode` (optional, default `"range"`): `"range"` uses `/market_chart/range` (bulk,
 *   efficient for contiguous spans but capped at ~365 days back on the demo
 *   tier); `"per_date"` calls `/coins/bitcoin/history?date=…` once per date
 *   (works for any historical year, paced `PER_DATE_GAP_MS` apart, capped at
 *   `PER_DATE_MAX_CALLS` per invocation). Use **`per_date`** when `onlyMissing`
 *   + a wide range leaves only a few gap dates (e.g. the 10 zoom-out anniversary
 *   dates spanning a decade) — the endpoint swap avoids the demo-tier empty-
 *   array problem that made `refresh-btc-prices` fail silently.
 * - `chunkDays` (optional, default 45): CoinGecko window size per HTTP call. Ignored in `per_date` mode.
 * - `maxChunks` (optional, default 10, max 25): CoinGecko **calls** per invocation; if more
 *   days remain, response includes **`resumeFrom`** — POST again with **`from: resumeFrom`**
 *   and the **same** **`to`** until **`completed: true`** (multi-year / ~10y backfills). In
 *   `per_date` mode this is replaced by `PER_DATE_MAX_CALLS`.
 *
 * **`from`/`to` span:** up to **4500** UTC calendar days (~12.3 years) per request body.
 */

serve(
  withRequestLogging("backfill-btc-prices", async ({ req }) => {
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
    if (dayCount > MAX_SPAN_DAYS) {
      return new Response(
        JSON.stringify({
          error: `Range too large (${dayCount} days). Max span is ${MAX_SPAN_DAYS} days; split into multiple ranges.`,
          maxSpanDays: MAX_SPAN_DAYS,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const onlyMissing = body.onlyMissing !== false;
    const dryRun = body.dryRun === true;
    const mode: "range" | "per_date" = body.mode === "per_date" ? "per_date" : "range";
    const chunkDays = typeof body.chunkDays === "number" && body.chunkDays > 0 && body.chunkDays <= 90
      ? Math.floor(body.chunkDays)
      : DEFAULT_CHUNK_DAYS;
    let maxChunks = DEFAULT_MAX_CHUNKS;
    if (typeof body.maxChunks === "number" && Number.isFinite(body.maxChunks)) {
      maxChunks = Math.min(ABSOLUTE_MAX_CHUNKS, Math.max(1, Math.floor(body.maxChunks)));
    }

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
          completed: true,
          resumeFrom: null,
          abortReason: null,
          from: fromRaw,
          to: toRaw,
          onlyMissing,
          dryRun,
          maxChunks,
          daysTargeted: 0,
          daysUpserted: 0,
          chunks: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let daysUpserted = 0;
    let chunks = 0;
    let abortReason: string | null = null;
    let resumeFrom: string | null = null;

    if (mode === "per_date") {
      const fetchedAt = new Date().toISOString();
      const limit = Math.min(allKeys.length, PER_DATE_MAX_CALLS);
      const inserts: { date: string; price: number; fetched_at: string }[] = [];
      let rateLimited = 0;
      let other = 0;
      let i = 0;
      for (; i < limit; i++) {
        const dateKey = allKeys[i];
        if (i > 0) await new Promise((r) => setTimeout(r, PER_DATE_GAP_MS));
        const hit = await fetchCoinGeckoHistoryPrice(dateKey);
        chunks++;
        if (!hit) { other++; continue; }
        if ("rateLimited" in hit) {
          rateLimited++;
          abortReason = "rate_limited";
          break;
        }
        inserts.push({ date: dateKey, price: hit.price, fetched_at: fetchedAt });
      }

      if (!dryRun && inserts.length > 0) {
        const { error: upErr } = await supabase.from("btc_price_cache").upsert(inserts);
        if (upErr) {
          holzenEdgeError("backfill-btc", "upsert failed (per_date)", upErr);
          return new Response(JSON.stringify({ error: "Upsert failed", detail: String(upErr) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      daysUpserted += inserts.length;

      // If we hit the call cap or aborted mid-run, the next unattempted key becomes resumeFrom.
      if (i < allKeys.length) resumeFrom = allKeys[i] ?? null;

      const completed = abortReason === null && resumeFrom === null;
      const summary = abortReason
        ? `per_date partial: ${daysUpserted} rows, ${chunks} calls, stopped=${abortReason}`
        : resumeFrom
        ? `per_date partial: ${daysUpserted} rows, ${chunks} calls, resumeFrom=${resumeFrom}`
        : `per_date: upserted ${daysUpserted} rows, ${chunks} calls${dryRun ? " (dryRun)" : ""}`;
      holzenEdgeRun("backfill-btc", "run complete", { ms: Date.now() - t0, summary });

      return new Response(
        JSON.stringify({
          success: abortReason === null,
          completed,
          resumeFrom,
          abortReason,
          from: fromRaw,
          to: toRaw,
          onlyMissing,
          dryRun,
          mode,
          maxChunks: PER_DATE_MAX_CALLS,
          daysTargeted: allKeys.length,
          daysUpserted,
          chunks,
          rateLimited,
          otherFailures: other,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    for (let i = 0; i < allKeys.length; i += chunkDays) {
      if (chunks >= maxChunks) {
        resumeFrom = allKeys[i] ?? null;
        break;
      }

      const slice = allKeys.slice(i, i + chunkDays);
      const chunkStartMs = parseDateKey(slice[0]!)!;
      const chunkEndMs = parseDateKey(slice[slice.length - 1]!)!;
      const fromSec = Math.floor((chunkStartMs - 86400000) / 1000);
      const toSec = Math.floor((chunkEndMs + 86400000) / 1000);

      chunks++;
      if (chunks > 1) await new Promise((r) => setTimeout(r, COINGECKO_GAP_MS));

      const url =
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${fromSec}&to=${toSec}`;
      const res = await fetch(url, { headers: coingeckoHeaders() });

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

    const completed = abortReason === null && resumeFrom === null;
    const summary = abortReason
      ? `partial: ${daysUpserted} rows, ${chunks} chunks, stopped=${abortReason}`
      : resumeFrom
      ? `partial: ${daysUpserted} rows, ${chunks} chunks, resumeFrom=${resumeFrom}`
      : `upserted ${daysUpserted} rows, ${chunks} chunks${dryRun ? " (dryRun)" : ""}`;
    holzenEdgeRun("backfill-btc", "run complete", { ms: Date.now() - t0, summary });

    return new Response(
      JSON.stringify({
        success: abortReason === null,
        completed,
        resumeFrom,
        abortReason,
        from: fromRaw,
        to: toRaw,
        onlyMissing,
        dryRun,
        mode,
        maxChunks,
        daysTargeted: allKeys.length,
        daysUpserted,
        chunks,
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
  })
);
