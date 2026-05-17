import { supabase } from '@/integrations/supabase/client';

export const PRACTICE_ENTRIES_QUERY_PREFIX = ['practice-entries'] as const;

export const PRACTICE_ENTRIES_WEEKLY_COUNT_QUERY_LEAF = 'weekly-count' as const;

export const PRACTICE_ENTRIES_WEEKLY_COUNT_QUERY_PREFIX = [
  ...PRACTICE_ENTRIES_QUERY_PREFIX,
  PRACTICE_ENTRIES_WEEKLY_COUNT_QUERY_LEAF,
] as const;

export const PRACTICE_ENTRIES_WEEKLY_COUNT_DISABLED_USER_ID = 'none' as const;

export const PRACTICE_ENTRIES_WEEKLY_COUNT_NONE_QUERY_KEY = [
  ...PRACTICE_ENTRIES_WEEKLY_COUNT_QUERY_PREFIX,
  PRACTICE_ENTRIES_WEEKLY_COUNT_DISABLED_USER_ID,
] as const;

/** Shared with practice flows that should refresh the Home practice widget counter. */
export function practiceEntriesWeeklyCountQueryKey(userId: string) {
  return [...PRACTICE_ENTRIES_WEEKLY_COUNT_QUERY_PREFIX, userId] as const;
}

export async function fetchWeeklyPracticeEntryCount(userId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('practice_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo);
  if (error) throw error;
  return count ?? 0;
}

export function getPracticeEntriesWeeklyCountQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? practiceEntriesWeeklyCountQueryKey(userId) : PRACTICE_ENTRIES_WEEKLY_COUNT_NONE_QUERY_KEY,
    queryFn: () => fetchWeeklyPracticeEntryCount(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
