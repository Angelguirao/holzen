import { supabase } from '@/integrations/supabase/client';

export const GROUND_HISTORY_PAGE_SIZE = 20;

export interface GroundingEntry {
  id: string;
  created_at: string;
  mood: string | null;
  duration_seconds: number | null;
  body: string | null;
  trigger_text: string | null;
}

export type GroundingHistoryStats = { totalSessions: number; totalMinutes: number };

export const GROUND_HISTORY_ENTRIES_QUERY_PREFIX = ['tools', 'ground-history', 'entries'] as const;
export const GROUND_HISTORY_STATS_QUERY_PREFIX = ['tools', 'ground-history', 'stats'] as const;

/** Signed-out placeholder segment (this feature predates the repo-wide `__none__` convention). */
export const GROUND_HISTORY_DISABLED_USER_ID = 'none' as const;

export const GROUND_HISTORY_ENTRIES_NONE_QUERY_KEY = [
  ...GROUND_HISTORY_ENTRIES_QUERY_PREFIX,
  GROUND_HISTORY_DISABLED_USER_ID,
] as const;

export function groundHistoryEntriesQueryKey(userId: string) {
  return [...GROUND_HISTORY_ENTRIES_QUERY_PREFIX, userId] as const;
}

export const GROUND_HISTORY_STATS_NONE_QUERY_KEY = [
  ...GROUND_HISTORY_STATS_QUERY_PREFIX,
  GROUND_HISTORY_DISABLED_USER_ID,
] as const;

/** Used by `Ground` after a ritual save so Journey → Grounding history totals refresh without staleTime wait. */
export function groundHistoryStatsQueryKey(userId: string) {
  return [...GROUND_HISTORY_STATS_QUERY_PREFIX, userId] as const;
}

export async function fetchGroundingHistoryStats(userId: string): Promise<GroundingHistoryStats> {
  const { data, count, error } = await supabase
    .from('practice_entries')
    .select('duration_seconds', { count: 'exact' })
    .eq('user_id', userId)
    .eq('type', 'grounding');

  if (error || !data) {
    return { totalSessions: 0, totalMinutes: 0 };
  }
  const totalSessions = count ?? data.length;
  const mins = data.reduce((sum, e) => sum + ((e.duration_seconds as number) || 0), 0) / 60;
  return { totalSessions, totalMinutes: Math.round(mins) };
}

export async function fetchGroundHistoryEntriesPage(userId: string, offset: number): Promise<GroundingEntry[]> {
  const { data, error } = await supabase
    .from('practice_entries')
    .select('id, created_at, mood, duration_seconds, body, trigger_text')
    .eq('user_id', userId)
    .eq('type', 'grounding')
    .order('created_at', { ascending: false })
    .range(offset, offset + GROUND_HISTORY_PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []) as GroundingEntry[];
}

export function getGroundHistoryStatsQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? groundHistoryStatsQueryKey(userId) : GROUND_HISTORY_STATS_NONE_QUERY_KEY,
    queryFn: () => fetchGroundingHistoryStats(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export function getGroundHistoryEntriesInfiniteQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? groundHistoryEntriesQueryKey(userId) : GROUND_HISTORY_ENTRIES_NONE_QUERY_KEY,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchGroundHistoryEntriesPage(userId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: GroundingEntry[], allPages: GroundingEntry[][]) => {
      if (lastPage.length < GROUND_HISTORY_PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
