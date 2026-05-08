import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getCompletedPauseCountQueryOptions } from '@/lib/completed-pause-count-query';

export {
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
  fetchCompletedPauseCount,
  getCompletedPauseCountQueryOptions,
} from '@/lib/completed-pause-count-query';

/**
 * Exact count of completed pause rows for the current user (`pause_instances.state = 'completed'`).
 * `null` while loading or when signed out.
 */
export function useCompletedPauseCount(): number | null {
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isPending } = useQuery(getCompletedPauseCountQueryOptions(userId));
  if (!userId) return null;
  if (isPending && data === undefined) return null;
  return data ?? 0;
}
