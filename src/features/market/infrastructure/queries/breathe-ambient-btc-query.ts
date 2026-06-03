import { fetchBtcData } from '@/features/market/infrastructure/fetch-market-data';
import type { BtcPriceData } from '@/features/market/domain/market-quote';
import { BREATHE_AMBIENT_BTC_QUERY_KEY } from '@/features/market/application/queries/breathe-ambient-btc-keys';

export { BREATHE_AMBIENT_BTC_QUERY_KEY } from '@/features/market/application/queries/breathe-ambient-btc-keys';

async function fetchBreatheAmbientBtcUsd(): Promise<BtcPriceData | null> {
  try {
    return await fetchBtcData('USD');
  } catch {
    return null;
  }
}

/** Not mounted on pause-first routes; kept for legacy breathe tooling exports. */
export function getBreatheAmbientBtcQueryOptions(enabled: boolean) {
  return {
    queryKey: BREATHE_AMBIENT_BTC_QUERY_KEY,
    queryFn: fetchBreatheAmbientBtcUsd,
    enabled,
    staleTime: 5 * 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
