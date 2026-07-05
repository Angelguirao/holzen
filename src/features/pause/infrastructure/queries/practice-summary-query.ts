import type { UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { holzenLog } from '@/lib/holzen-console';
import {
  EMPTY_PRACTICE_SUMMARY,
  mapPracticeSummaryRpc,
  practiceSummaryToHomeStats,
  type PracticeSummary,
} from '@/features/pause/domain/practice/practice-summary';
import {
  PRACTICE_SUMMARY_NONE_KEY,
  PRACTICE_SUMMARY_QUERY_KEY,
} from './practice-summary-query-key';

export {
  PRACTICE_SUMMARY_DISABLED_USER_ID,
  PRACTICE_SUMMARY_NONE_KEY,
  PRACTICE_SUMMARY_QUERY_PREFIX,
  PRACTICE_SUMMARY_QUERY_KEY,
} from './practice-summary-query-key';

const PRACTICE_SUMMARY_STALE_MS = 60_000;

export async function fetchPracticeSummary(userId: string): Promise<PracticeSummary> {
  const { data, error } = await supabase.rpc('get_practice_summary' as never, {
    p_user_id: userId,
  } as never);

  if (error) {
    holzenLog.home('practice_summary_unavailable', { message: error.message });
    return EMPTY_PRACTICE_SUMMARY;
  }

  return mapPracticeSummaryRpc(data);
}

export async function fetchHomePracticeStats(userId: string): Promise<{
  completedPauseCount: number;
  presenceXp: number;
}> {
  return practiceSummaryToHomeStats(await fetchPracticeSummary(userId));
}

export async function fetchCompletedPauseCount(userId: string): Promise<number> {
  return (await fetchPracticeSummary(userId)).completedPauseCount;
}

export function getPracticeSummaryQueryOptions(
  userId: string | undefined,
): Pick<
  UseQueryOptions<PracticeSummary>,
  'queryKey' | 'queryFn' | 'enabled' | 'staleTime' | 'refetchOnWindowFocus' | 'retry'
> {
  return {
    queryKey: userId ? PRACTICE_SUMMARY_QUERY_KEY(userId) : PRACTICE_SUMMARY_NONE_KEY,
    queryFn: () => fetchPracticeSummary(userId!),
    enabled: Boolean(userId),
    staleTime: PRACTICE_SUMMARY_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
