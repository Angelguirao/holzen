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

export function getHolzenNumberQueryOptions() {
  return {
    queryKey: HOLZEN_NUMBER_QUERY_KEY,
    queryFn: fetchHolzenNumber,
    refetchInterval: 60_000,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
