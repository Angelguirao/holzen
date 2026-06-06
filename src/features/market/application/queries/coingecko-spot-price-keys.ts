/** TanStack keys for lightweight CoinGecko `simple/price` (bitcoin · USD today). */

export const COINGECKO_SPOT_PRICE_QUERY_PREFIX = ['external', 'coingecko'] as const;

export const COINGECKO_SPOT_PRICE_QUERY_LEAF = 'btc-usd' as const;

export const COINGECKO_SPOT_PRICE_QUERY_KEY = [
  ...COINGECKO_SPOT_PRICE_QUERY_PREFIX,
  COINGECKO_SPOT_PRICE_QUERY_LEAF,
] as const;
