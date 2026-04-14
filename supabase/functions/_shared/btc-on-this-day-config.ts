/**
 * Zoom Out + `refresh-btc-prices` must agree: UTC “on this day” anniversaries
 * (same month/day, N calendar years ago) loaded from `btc_price_cache`.
 */
export const BTC_ON_THIS_DAY_YEARS_BACK = 10;

/** `[1, 2, …, BTC_ON_THIS_DAY_YEARS_BACK]` */
export function btcOnThisDayYearOffsets(): number[] {
  return Array.from({ length: BTC_ON_THIS_DAY_YEARS_BACK }, (_, i) => i + 1);
}
