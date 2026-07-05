async function fetchFearGreedFromApi(): Promise<{ value: number; label: string } | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return null;
    const value = parseInt(entry.value, 10);
    if (Number.isNaN(value)) return null;
    return {
      value,
      label: entry.value_classification as string,
    };
  } catch {
    return null;
  }
}

export const FEAR_GREED_DISPLAY_QUERY_KEY = ['market', 'fear-greed'] as const;

export function getFearGreedDisplayQueryOptions(enabled: boolean) {
  return {
    queryKey: FEAR_GREED_DISPLAY_QUERY_KEY,
    queryFn: fetchFearGreedFromApi,
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: 1,
  } as const;
}
