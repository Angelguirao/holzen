import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { BTC_ON_THIS_DAY_YEARS_BACK, btcOnThisDayYearOffsets } from "./btc-on-this-day-config.ts";
import { warmMissingBtcPrices } from "./btc-price-warm.ts";
import { errorMessageFromUnknown, getEdgeRuntime } from "./edge-runtime.ts";

export type BtcOnThisDayEntry = { yearsAgo: number; price: number; date: string };

export interface BtcOnThisDayPrices {
  onThisDay: BtcOnThisDayEntry[];
  currentPrice: number | null;
  partial: boolean;
}

interface PriceCacheRow {
  date: string;
  price: number;
}

type PriceLog = (msg: string, extra?: Record<string, unknown>) => void;

/**
 * Read BTC anniversary prices from `btc_price_cache` (kept warm by refresh-btc-prices cron).
 * Used by Look Back; Zoom Out no longer surfaces price rows in the client.
 */
export async function fetchBtcOnThisDayPrices(
  svcClient: SupabaseClient,
  _context: string | undefined,
  log: PriceLog,
): Promise<BtcOnThisDayPrices> {
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  const todayKey = today.toISOString().slice(0, 10);

  const yearTargets = btcOnThisDayYearOffsets().map((y) => {
    const d = new Date(Date.UTC(currentYear - y, month, day));
    return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10) };
  });

  const allDateKeys = [todayKey, ...yearTargets.map((t) => t.dateKey)];

  const { data: cached } = await svcClient
    .from("btc_price_cache")
    .select("date, price")
    .in("date", allDateKeys);

  const rows = (cached ?? []) as PriceCacheRow[];
  const priceMap = new Map<string, number>(rows.map((r) => [r.date, r.price]));

  const currentPrice = priceMap.get(todayKey) ?? null;

  const onThisDay: BtcOnThisDayEntry[] = [];
  for (const target of yearTargets) {
    const price = priceMap.get(target.dateKey);
    if (typeof price === "number") {
      onThisDay.push({ yearsAgo: target.yearsAgo, date: target.dateKey, price: Math.round(price) });
    }
  }

  log(`btc on this day from cache: current=${currentPrice ?? "none"}, historical=${onThisDay.length}/${BTC_ON_THIS_DAY_YEARS_BACK}`);

  const missingDateKeys = yearTargets
    .filter((t) => !priceMap.has(t.dateKey))
    .map((t) => t.dateKey);
  const rt = getEdgeRuntime();
  if (missingDateKeys.length > 0 && rt) {
    try {
      rt.waitUntil(
        warmMissingBtcPrices(svcClient, missingDateKeys)
          .then((warm) => {
            log(
              `btc warm-on-read: attempted=${warm.attempted} upserted=${warm.upserted} ` +
                `rate_limited=${warm.rateLimited} other=${warm.other} skipped_recent=${warm.skippedRecent}`,
            );
          })
          .catch((e) => {
            log(`btc warm-on-read failed: ${errorMessageFromUnknown(e)}`);
          }),
      );
    } catch (e) {
      log(`btc warm-on-read scheduling failed: ${errorMessageFromUnknown(e)}`);
    }
  }

  return {
    onThisDay,
    currentPrice: typeof currentPrice === "number" ? Math.round(currentPrice) : null,
    partial: onThisDay.length < yearTargets.length,
  };
}
