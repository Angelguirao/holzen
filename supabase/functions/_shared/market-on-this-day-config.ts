/**
 * Zoom Out + `refresh-market-prices` must agree: UTC “on this day” anniversaries
 * (same month/day, N calendar years ago) loaded from `market_price_cache`.
 */
export const MARKET_ON_THIS_DAY_YEARS_BACK = 10;

/** `[1, 2, …, MARKET_ON_THIS_DAY_YEARS_BACK]` */
export function marketOnThisDayYearOffsets(): number[] {
  return Array.from({ length: MARKET_ON_THIS_DAY_YEARS_BACK }, (_, i) => i + 1);
}
