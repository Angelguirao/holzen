import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { holzenLog } from '@/lib/holzen-console';

const COMPLETED_PAUSE_COUNT_NONE_KEY = ['pause-instances', 'completed-count', '__none__'] as const;

export const COMPLETED_PAUSE_COUNT_QUERY_KEY = (userId: string) =>
  ['pause-instances', 'completed-count', userId] as const;

async function fetchCompletedPauseCount(userId: string): Promise<number> {
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

/** Shared TanStack options for completed-pause count (Home + Tools). */
export function getCompletedPauseCountQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? COMPLETED_PAUSE_COUNT_QUERY_KEY(userId) : COMPLETED_PAUSE_COUNT_NONE_KEY,
    queryFn: () => fetchCompletedPauseCount(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  } as const;
}

/**
 * Exact count of completed pause rows for the current user (`pause_instances.state = 'completed'`).
 * `null` while loading or when signed out.
 */
export function useCompletedPauseCount(): number | null {
  const { user } = useAuth();
  const userId = user?.id;
  const { data, isPending } = useQuery({
    ...getCompletedPauseCountQueryOptions(userId),
  });
  if (!userId) return null;
  if (isPending && data === undefined) return null;
  return data ?? 0;
}
