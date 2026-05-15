/**
 * Shared "fill missing BTC prices" helper.
 *
 * Used by two callers:
 * 1. `refresh-btc-prices` cron — fills the 10 "on this day" anniversary dates on
 *    a schedule (every ~15 min).
 * 2. `zoom-out.ts` background warm-on-read — when a session reads the cache and
 *    finds gaps, fires `EdgeRuntime.waitUntil(warmMissingBtcPrices(…))` so the
 *    next session has a full timeline without blocking the current one.
 *
 * Behaviour:
 * - Uses `/coins/bitcoin/history?date=DD-MM-YYYY` via `fetchCoinGeckoHistoryPrice`.
 *   Works on the free/demo tier for any historical date, unlike `/market_chart/range`
 *   which silently caps at ~365 days back.
 * - Parallelises per-date calls with bounded concurrency (default 5). Keeps
 *   wall-clock short (~2-3s for 10 dates) while staying under CoinGecko's demo
 *   quota (~30 req/min) — peak burst of 5 concurrent requests is well-behaved.
 * - Before hitting CoinGecko, drops dates already fetched within `DEDUPE_MS`
 *   (15 min). This dedupes concurrent warm-on-read calls from multiple user
 *   sessions for the same gap — only one actually reaches CoinGecko, the rest
 *   exit early when they see the 15-min-fresh row.
 * - Idempotent via `upsert` on `btc_price_cache (date)`.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { fetchCoinGeckoHistoryPrice } from "./coingecko.ts";

const DEFAULT_CONCURRENCY = 5;
const BATCH_GAP_MS = 1200;
/** Skip dates already fetched within this window (dedupe concurrent warmers). */
const DEDUPE_MS = 15 * 60 * 1000;

export interface WarmResult {
  attempted: number;
  upserted: number;
  rateLimited: number;
  other: number;
  skippedRecent: number;
}

/**
 * Fill `btc_price_cache` for the given UTC `YYYY-MM-DD` date keys.
 *
 * Caller is responsible for choosing the date keys (e.g. today + 1..10 year
 * anniversaries for zoom-out). Returns counts for operator logging.
 *
 * Optional **`incoming`** forwards W3C trace headers on CoinGecko fetches when
 * the caller has an edge `Request` (e.g. `refresh-btc-prices` cron).
 */
export async function warmMissingBtcPrices(
  svcClient: SupabaseClient,
  dateKeys: string[],
  opts: { concurrency?: number; incoming?: Request } = {},
): Promise<WarmResult> {
  const unique = Array.from(new Set(dateKeys));
  if (unique.length === 0) {
    return { attempted: 0, upserted: 0, rateLimited: 0, other: 0, skippedRecent: 0 };
  }

  // Filter out dates recently fetched — short-circuits duplicate concurrent warmers.
  const freshCutoff = new Date(Date.now() - DEDUPE_MS).toISOString();
  let skippedRecent = 0;
  let toFetch = unique;
  try {
    const { data: existing } = await svcClient
      .from("btc_price_cache")
      .select("date, fetched_at")
      .in("date", unique);
    type BtcFreshRow = { date?: string | null; fetched_at?: string | null };
    const recent = new Set(
      (existing ?? [])
        .filter((r: BtcFreshRow) => Boolean(r?.fetched_at && r.fetched_at > freshCutoff))
        .map((r: BtcFreshRow) => r.date)
        .filter((d): d is string => typeof d === "string"),
    );
    skippedRecent = recent.size;
    toFetch = unique.filter((k) => !recent.has(k));
  } catch {
    // Non-fatal; if the dedupe read fails we just proceed with full list.
  }

  if (toFetch.length === 0) {
    return { attempted: 0, upserted: 0, rateLimited: 0, other: 0, skippedRecent };
  }

  const concurrency = Math.max(1, Math.min(opts.concurrency ?? DEFAULT_CONCURRENCY, toFetch.length));
  const fetchedAt = new Date().toISOString();
  const inserts: { date: string; price: number; fetched_at: string }[] = [];
  let rateLimited = 0;
  let other = 0;
  let attempted = 0;

  for (let i = 0; i < toFetch.length; i += concurrency) {
    if (i > 0) await new Promise((r) => setTimeout(r, BATCH_GAP_MS));
    const batch = toFetch.slice(i, i + concurrency);
    attempted += batch.length;
    const batchResults = await Promise.all(
      batch.map((k) => fetchCoinGeckoHistoryPrice(k, opts.incoming)),
    );
    for (let j = 0; j < batch.length; j++) {
      const hit = batchResults[j];
      if (!hit) { other++; continue; }
      if ("rateLimited" in hit) { rateLimited++; continue; }
      inserts.push({ date: batch[j], price: hit.price, fetched_at: fetchedAt });
    }
  }

  if (inserts.length > 0) {
    const { error } = await svcClient.from("btc_price_cache").upsert(inserts);
    if (error) {
      // Caller decides how to surface; keep helper pure on the response side.
      throw new Error(`btc_price_cache upsert failed: ${error.message ?? String(error)}`);
    }
  }

  return { attempted, upserted: inserts.length, rateLimited, other, skippedRecent };
}
