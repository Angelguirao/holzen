import { fetchHolzenNumberEdge, type HolzenNumberData } from '../edge/holzen-number-edge';

export type { HolzenNumberData };

export const HOLZEN_NUMBER_QUERY_PREFIX = ['public'] as const;

export const HOLZEN_NUMBER_QUERY_SEGMENT = 'holzen-number' as const;

export const HOLZEN_NUMBER_QUERY_KEY = [
  ...HOLZEN_NUMBER_QUERY_PREFIX,
  HOLZEN_NUMBER_QUERY_SEGMENT,
] as const;

export async function fetchHolzenNumber(): Promise<HolzenNumberData | null> {
  try {
    const { data: result, error } = await fetchHolzenNumberEdge();
    if (error || !result) return null;
    return result as HolzenNumberData;
  } catch {
    return null;
  }
}

/**
 * Public daily aggregate (`get_holzen_number` via edge / `holzen_community_stats` cache).
 * No polling — warm on Home bootstrap; refetch when invalidated (own pause, or
 * `holzen_community_stats` Realtime when anyone pauses).
 */
export function getHolzenNumberQueryOptions() {
  return {
    queryKey: HOLZEN_NUMBER_QUERY_KEY,
    queryFn: fetchHolzenNumber,
    staleTime: 5 * 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  } as const;
}
