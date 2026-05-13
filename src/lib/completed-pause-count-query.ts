/**
 * Completed pause_instance count for the signed-in user (shared TanStack key).
 */

import { supabase } from '@/integrations/supabase/client';
import type { UseQueryOptions } from '@tanstack/react-query';
import { holzenLog } from '@/lib/holzen-console';

export const COMPLETED_PAUSE_COUNT_QUERY_PREFIX = ['pause-instances', 'completed-count'] as const;

/** Signed-out placeholder segment (matches other `__none__` user-id keys). */
export const COMPLETED_PAUSE_COUNT_DISABLED_USER_ID = '__none__' as const;

export const COMPLETED_PAUSE_COUNT_NONE_KEY = [
  ...COMPLETED_PAUSE_COUNT_QUERY_PREFIX,
  COMPLETED_PAUSE_COUNT_DISABLED_USER_ID,
] as const;

export const COMPLETED_PAUSE_COUNT_QUERY_KEY = (userId: string) =>
  [...COMPLETED_PAUSE_COUNT_QUERY_PREFIX, userId] as const;

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

const COMPLETED_PAUSE_COUNT_STALE_MS = 60_000;

/** Shared TanStack options for completed-pause count (Home + Tools + Journey). */
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
