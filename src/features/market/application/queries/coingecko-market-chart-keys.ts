export const COINGECKO_MARKET_CHART_QUERY_PREFIX = ['external', 'coingecko', 'market_chart'] as const;

export const coingeckoMarketChartQueryKey = (
  currency: string,
  coinId: string,
  retryNonce: number,
) =>
  [
    ...COINGECKO_MARKET_CHART_QUERY_PREFIX,
    coinId,
    currency.toLowerCase(),
    retryNonce,
  ] as const;
