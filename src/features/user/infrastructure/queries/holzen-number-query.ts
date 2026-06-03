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
 * Public community aggregates (`get_holzen_number` via edge / `holzen_community_stats` cache):
 * pausing now (active|engaged) + paused today (UTC).
 * No polling — warm on Home bootstrap; refetch when invalidated (own pause, or
 * `holzen_community_stats` Realtime when pause activity changes).
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
