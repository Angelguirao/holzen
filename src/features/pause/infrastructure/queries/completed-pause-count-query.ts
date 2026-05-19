import type { UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { holzenLog } from '@/lib/holzen-console';
import {
  COMPLETED_PAUSE_COUNT_NONE_KEY,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
} from '@/features/pause/application/queries/completed-pause-count-keys';

export {
  COMPLETED_PAUSE_COUNT_DISABLED_USER_ID,
  COMPLETED_PAUSE_COUNT_NONE_KEY,
  COMPLETED_PAUSE_COUNT_QUERY_PREFIX,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
} from '@/features/pause/application/queries/completed-pause-count-keys';

const COMPLETED_PAUSE_COUNT_STALE_MS = 60_000;

export async function fetchCompletedPauseCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('pause_instances' as never)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('state', 'completed');
  if (error) {
    holzenLog.home('completed_pause_count_unavailable', { message: error.message });
    return 0;
  }
  return count ?? 0;
}

/** Shared TanStack options for completed-pause count (Home + Journey). */
export function getCompletedPauseCountQueryOptions(
  userId: string | undefined,
): Pick<
  UseQueryOptions<number>,
  'queryKey' | 'queryFn' | 'enabled' | 'staleTime' | 'refetchOnWindowFocus' | 'retry'
> {
  return {
    queryKey: userId ? COMPLETED_PAUSE_COUNT_QUERY_KEY(userId) : COMPLETED_PAUSE_COUNT_NONE_KEY,
    queryFn: () => fetchCompletedPauseCount(userId!),
    enabled: Boolean(userId),
    staleTime: COMPLETED_PAUSE_COUNT_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
