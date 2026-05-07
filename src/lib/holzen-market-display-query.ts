import { fetchMarketData } from '@/lib/btc';
import { normalizeTrackedAssetId } from '@/lib/tracked-assets';

/** TanStack cache for CoinGecko-backed market strip on Home (`useHolzen`). */
export function holzenMarketDisplayQueryKey(coinIdRaw: string | null | undefined, currency: string) {
  return ['holzen', 'market-display', normalizeTrackedAssetId(coinIdRaw), currency.toUpperCase()] as const;
}

export function getHolzenMarketDisplayQueryOptions(input: {
  coinIdRaw: string | null | undefined;
  currency: string;
  enabled: boolean;
}) {
  const { coinIdRaw, currency, enabled } = input;
  return {
    queryKey: holzenMarketDisplayQueryKey(coinIdRaw, currency),
    queryFn: () => fetchMarketData(coinIdRaw, currency),
    enabled,
    staleTime: 4 * 60_000,
    gcTime: 15 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  } as const;
}
