import type { QueryClient } from '@tanstack/react-query';
import { COINGECKO_SPOT_PRICE_QUERY_KEY } from '@/features/market/application/queries/coingecko-spot-price-keys';

export {
  COINGECKO_SPOT_PRICE_QUERY_KEY,
  COINGECKO_SPOT_PRICE_QUERY_LEAF,
  COINGECKO_SPOT_PRICE_QUERY_PREFIX,
} from '@/features/market/application/queries/coingecko-spot-price-keys';

export async function fetchCoingeckoSpotPriceUsd(): Promise<number | null> {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    if (!r.ok) return null;
    const d = (await r.json()) as { bitcoin?: { usd?: number } };
    return d?.bitcoin?.usd ?? null;
  } catch {
    return null;
  }
}

export function getCoingeckoSpotPriceUsdQueryOptions() {
  return {
    queryKey: COINGECKO_SPOT_PRICE_QUERY_KEY,
    queryFn: fetchCoingeckoSpotPriceUsd,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export function prefetchCoingeckoSpotPriceUsd(queryClient: QueryClient): Promise<void> {
  return queryClient.prefetchQuery(getCoingeckoSpotPriceUsdQueryOptions());
}
