import { invokeEdge } from '@/lib/invoke-edge';

export interface HolzenNumberData {
  total: number;
  held_steady: number;
  percent: number;
  calculated_at: string;
}

export const HOLZEN_NUMBER_QUERY_KEY = ['public', 'holzen-number'] as const;

export async function fetchHolzenNumber(): Promise<HolzenNumberData | null> {
  try {
    const { data: result, error } = await invokeEdge<HolzenNumberData>('holzen-number');
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
