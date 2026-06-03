import { fetchMarketDataLite } from '@/features/market/infrastructure/fetch-market-data';
import { holzenMarketDisplayQueryKey } from '@/features/market/application/queries/holzen-market-display-keys';

export {
  HOLZEN_MARKET_DISPLAY_QUERY_PREFIX,
  holzenMarketDisplayQueryKey,
} from '@/features/market/application/queries/holzen-market-display-keys';

export function getHolzenMarketDisplayQueryOptions(input: {
  coinIdRaw: string | null | undefined;
  currency: string;
  enabled: boolean;
}) {
  const { coinIdRaw, currency, enabled } = input;
  return {
    queryKey: holzenMarketDisplayQueryKey(coinIdRaw, currency),
    queryFn: () => fetchMarketDataLite(coinIdRaw, currency),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
  } as const;
}
