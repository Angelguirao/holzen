import { supabase } from '@/integrations/supabase/client';

export interface NightReflection {
  id: string;
  message: string;
  btc_change_percent: number;
  btc_direction: string;
  created_at: string;
}

function getDismissedStorageKey(userId: string) {
  return `holzen_night_reflection_dismissed_${userId}`;
}

export function readNightReflectionDismissedIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getDismissedStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function writeNightReflectionDismissedIds(userId: string, ids: string[]) {
  try {
    localStorage.setItem(getDismissedStorageKey(userId), JSON.stringify(ids.slice(-50)));
  } catch {
    /* ignore local cache write failures */
  }
}

export const NIGHT_REFLECTION_VISIBLE_NONE_QUERY_KEY = ['night-reflections', 'visible', 'none'] as const;

export const NIGHT_REFLECTION_VISIBLE_QUERY_KEY = (userId: string) =>
  ['night-reflections', 'visible', userId] as const;

export async function fetchVisibleNightReflection(userId: string): Promise<NightReflection | null> {
  const locallyDismissed = new Set(readNightReflectionDismissedIds(userId));
  const { data, error } = await supabase
    .from('night_reflections')
    .select('id, message, btc_change_percent, btc_direction, created_at')
    .eq('user_id', userId)
    .eq('dismissed', false)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error || !data?.length) return null;
  const firstVisible = data.find((item) => !locallyDismissed.has(item.id));
  return firstVisible ? (firstVisible as unknown as NightReflection) : null;
}

export function getVisibleNightReflectionQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? NIGHT_REFLECTION_VISIBLE_QUERY_KEY(userId) : NIGHT_REFLECTION_VISIBLE_NONE_QUERY_KEY,
    queryFn: () => fetchVisibleNightReflection(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
