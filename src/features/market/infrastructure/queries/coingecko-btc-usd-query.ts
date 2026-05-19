import type { QueryClient } from '@tanstack/react-query';
import { COINGECKO_BTC_USD_QUERY_KEY } from '@/features/market/application/queries/coingecko-btc-usd-keys';

export {
  COINGECKO_BTC_USD_QUERY_KEY,
  COINGECKO_BTC_USD_QUERY_LEAF,
  COINGECKO_BTC_USD_QUERY_PREFIX,
} from '@/features/market/application/queries/coingecko-btc-usd-keys';

export async function fetchCoingeckoBtcUsd(): Promise<number | null> {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    if (!r.ok) return null;
    const d = (await r.json()) as { bitcoin?: { usd?: number } };
    return d?.bitcoin?.usd ?? null;
  } catch {
    return null;
  }
}

export function getCoingeckoBtcUsdQueryOptions() {
  return {
    queryKey: COINGECKO_BTC_USD_QUERY_KEY,
    queryFn: fetchCoingeckoBtcUsd,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export function prefetchCoingeckoBtcUsd(queryClient: QueryClient): Promise<void> {
  return queryClient.prefetchQuery(getCoingeckoBtcUsdQueryOptions());
}
