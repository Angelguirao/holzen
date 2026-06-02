import type { UseQueryOptions } from '@tanstack/react-query';
import {
  practiceSummaryToHomeStats,
  type PracticeSummary,
} from '@/features/pause/domain/practice/practice-summary';
import {
  fetchPracticeSummary,
  getPracticeSummaryQueryOptions,
  PRACTICE_SUMMARY_QUERY_KEY,
} from './practice-summary-query';

/** @deprecated Prefer PRACTICE_SUMMARY_QUERY_KEY — same cache bucket. */
export {
  HOME_PRACTICE_STATS_DISABLED_USER_ID,
  HOME_PRACTICE_STATS_NONE_KEY,
  HOME_PRACTICE_STATS_QUERY_PREFIX,
  HOME_PRACTICE_STATS_QUERY_KEY,
} from './home-practice-stats-query-key';

export type HomePracticeStats = {
  completedPauseCount: number;
  presenceXp: number;
};

export function getHomePracticeStatsQueryOptions(
  userId: string | undefined,
): Pick<
  UseQueryOptions<PracticeSummary, Error, HomePracticeStats>,
  'queryKey' | 'queryFn' | 'enabled' | 'staleTime' | 'refetchOnWindowFocus' | 'retry' | 'select'
> {
  const base = getPracticeSummaryQueryOptions(userId);
  return {
    ...base,
    select: practiceSummaryToHomeStats,
  };
}

export { PRACTICE_SUMMARY_QUERY_KEY, fetchPracticeSummary, fetchHomePracticeStats };
