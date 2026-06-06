import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { MARKET_ON_THIS_DAY_YEARS_BACK, marketOnThisDayYearOffsets } from "./market-on-this-day-config.ts";
import { MARKET_PRICE_CACHE_TABLE } from "./market-price-cache-table.ts";
import { warmMissingMarketPrices } from "./market-price-warm.ts";
import { errorMessageFromUnknown, getEdgeRuntime } from "./edge-runtime.ts";

export type MarketOnThisDayEntry = { yearsAgo: number; price: number; date: string };

export interface MarketOnThisDayPrices {
  onThisDay: MarketOnThisDayEntry[];
  currentPrice: number | null;
  partial: boolean;
}

interface PriceCacheRow {
  date: string;
  price: number;
}

type PriceLog = (msg: string, extra?: Record<string, unknown>) => void;

/**
 * Read anniversary prices from `market_price_cache` (kept warm by refresh-market-prices cron).
 * Used by Look Back; Zoom Out no longer surfaces price rows in the client.
 */
export async function fetchMarketOnThisDayPrices(
  svcClient: SupabaseClient,
  _context: string | undefined,
  log: PriceLog,
): Promise<MarketOnThisDayPrices> {
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  const todayKey = today.toISOString().slice(0, 10);

  const yearTargets = marketOnThisDayYearOffsets().map((y) => {
    const d = new Date(Date.UTC(currentYear - y, month, day));
    return { yearsAgo: y, dateKey: d.toISOString().slice(0, 10) };
  });

  const allDateKeys = [todayKey, ...yearTargets.map((t) => t.dateKey)];

  const { data: cached } = await svcClient
    .from(MARKET_PRICE_CACHE_TABLE)
    .select("date, price")
    .in("date", allDateKeys);

  const rows = (cached ?? []) as PriceCacheRow[];
  const priceMap = new Map<string, number>(rows.map((r) => [r.date, r.price]));

  const currentPrice = priceMap.get(todayKey) ?? null;

  const onThisDay: MarketOnThisDayEntry[] = [];
  for (const target of yearTargets) {
    const price = priceMap.get(target.dateKey);
    if (typeof price === "number") {
      onThisDay.push({ yearsAgo: target.yearsAgo, date: target.dateKey, price: Math.round(price) });
    }
  }

  log(
    `market on this day from cache: current=${currentPrice ?? "none"}, historical=${onThisDay.length}/${MARKET_ON_THIS_DAY_YEARS_BACK}`,
  );

  const missingDateKeys = yearTargets
    .filter((t) => !priceMap.has(t.dateKey))
    .map((t) => t.dateKey);
  const rt = getEdgeRuntime();
  if (missingDateKeys.length > 0 && rt) {
    try {
      rt.waitUntil(
        warmMissingMarketPrices(svcClient, missingDateKeys)
          .then((warm) => {
            log(
              `market warm-on-read: attempted=${warm.attempted} upserted=${warm.upserted} ` +
                `rate_limited=${warm.rateLimited} other=${warm.other} skipped_recent=${warm.skippedRecent}`,
            );
          })
          .catch((e) => {
            log(`market warm-on-read failed: ${errorMessageFromUnknown(e)}`);
          }),
      );
    } catch (e) {
      log(`market warm-on-read scheduling failed: ${errorMessageFromUnknown(e)}`);
    }
  }

  return {
    onThisDay,
    currentPrice: typeof currentPrice === "number" ? Math.round(currentPrice) : null,
    partial: onThisDay.length < yearTargets.length,
  };
}
