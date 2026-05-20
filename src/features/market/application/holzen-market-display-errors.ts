/** CoinGecko / fetch failure copy shown in Holzen `error` when market display query fails. */
export const HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR =
  'Price data unavailable. CoinGecko may be down — retrying shortly.';

/** Generic market check failure copy (non-fetch errors). */
export const HOLZEN_MARKET_DISPLAY_RETRY_ERROR =
  'Could not check market data. Will retry automatically.';

/** Whether `error` is a mapped Holzen market display failure (price-only on Home when `btcData` is cached). */
export function isHolzenMarketDisplayUserError(error: string): boolean {
  return error === HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR || error === HOLZEN_MARKET_DISPLAY_RETRY_ERROR;
}
