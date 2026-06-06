import { fetchMarketData } from '@/features/market/infrastructure/fetch-market-data';
import type { MarketQuote } from '@/features/market/domain/market-quote';
import { BREATHE_AMBIENT_MARKET_QUERY_KEY } from '@/features/market/application/queries/breathe-ambient-market-keys';

export { BREATHE_AMBIENT_MARKET_QUERY_KEY } from '@/features/market/application/queries/breathe-ambient-market-keys';

async function fetchBreatheAmbientMarketUsd(): Promise<MarketQuote | null> {
  try {
    return await fetchMarketData('USD');
  } catch {
    return null;
  }
}

/** Not mounted on pause-first routes; kept for legacy breathe tooling exports. */
export function getBreatheAmbientMarketQueryOptions(enabled: boolean) {
  return {
    queryKey: BREATHE_AMBIENT_MARKET_QUERY_KEY,
    queryFn: fetchBreatheAmbientMarketUsd,
    enabled,
    staleTime: 5 * 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
