/** TanStack keys for lightweight CoinGecko `simple/price` (BTC · USD). */

export const COINGECKO_BTC_USD_QUERY_PREFIX = ['external', 'coingecko'] as const;

export const COINGECKO_BTC_USD_QUERY_LEAF = 'btc-usd' as const;

export const COINGECKO_BTC_USD_QUERY_KEY = [
  ...COINGECKO_BTC_USD_QUERY_PREFIX,
  COINGECKO_BTC_USD_QUERY_LEAF,
] as const;
