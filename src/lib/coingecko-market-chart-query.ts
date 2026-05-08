export interface CoingeckoMarketChartPoint {
  timestamp: number;
  price: number;
}

export const COINGECKO_MARKET_CHART_QUERY_PREFIX = ['external', 'coingecko', 'market_chart'] as const;

export function coingeckoMarketChartQueryKey(currency: string, coinId: string, retryNonce: number) {
  return [
    ...COINGECKO_MARKET_CHART_QUERY_PREFIX,
    coinId,
    currency.toLowerCase(),
    retryNonce,
  ] as const;
}

export async function fetchCoinGeckoMarketChart(
  currency: string,
  coinId: string,
  signal: AbortSignal,
): Promise<CoingeckoMarketChartPoint[]> {
  const cur = currency.toLowerCase();
  const id = encodeURIComponent(coinId);
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=7`,
    { signal },
  );
  if (!res.ok) throw new Error('fetch_failed');
  const json = await res.json();
  const prices: [number, number][] = json.prices;
  if (!prices?.length || prices.length < 2) {
    throw new Error('insufficient_points');
  }
  const step = Math.max(1, Math.floor(prices.length / 48));
  return prices
    .filter((_, i) => i % step === 0 || i === prices.length - 1)
    .map(([t, p]) => ({ timestamp: t, price: p }));
}

export function getCoingeckoMarketChartQueryOptions(input: {
  currency: string;
  coinId: string;
  retryNonce: number;
  enabled: boolean;
}) {
  const { currency, coinId, retryNonce, enabled } = input;
  return {
    queryKey: coingeckoMarketChartQueryKey(currency, coinId, retryNonce),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      fetchCoinGeckoMarketChart(currency, coinId, signal),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
