import type { UseQueryOptions } from '@tanstack/react-query';
import type { PracticeSummary } from '@/features/pause/domain/practice/practice-summary';
import {
  fetchCompletedPauseCount,
  getPracticeSummaryQueryOptions,
} from './practice-summary-query';

export {
  COMPLETED_PAUSE_COUNT_DISABLED_USER_ID,
  COMPLETED_PAUSE_COUNT_NONE_KEY,
  COMPLETED_PAUSE_COUNT_QUERY_PREFIX,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
} from './completed-pause-count-query-key';

/** @deprecated Same data as get_practice_summary — use PRACTICE_SUMMARY_QUERY_KEY. */
export const COMPLETED_PAUSE_COUNT_ALIASES_PRACTICE_SUMMARY = true;

export { fetchCompletedPauseCount };

/** Shared TanStack options: selects completed count from practice summary cache. */
export function getCompletedPauseCountQueryOptions(
  userId: string | undefined,
): Pick<
  UseQueryOptions<PracticeSummary, Error, number>,
  'queryKey' | 'queryFn' | 'enabled' | 'staleTime' | 'refetchOnWindowFocus' | 'retry' | 'select'
> {
  const base = getPracticeSummaryQueryOptions(userId);
  return {
    ...base,
    select: (summary) => summary.completedPauseCount,
  };
}
