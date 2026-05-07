import { supabase } from '@/integrations/supabase/client';
import type { PauseState } from '@/lib/pause-state';

export interface CurrentPauseRow {
  id: string;
  user_id: string;
  state: PauseState;
  source: string;
  created_at: string;
  window_ends_at: string;
  engaged_at: string | null;
  context_snapshot: Record<string, unknown> | null;
}

export const CURRENT_PAUSE_NONE_QUERY_KEY = ['pause', 'current-open', 'none'] as const;

export function currentPauseQueryKey(userId: string) {
  return ['pause', 'current-open', userId] as const;
}

export async function fetchCurrentPause(userId: string): Promise<CurrentPauseRow | null> {
  const { data, error } = await supabase
    .from('v_pause_current' as never)
    .select('id, user_id, state, source, created_at, window_ends_at, engaged_at, context_snapshot')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as unknown as CurrentPauseRow;
}

export function getCurrentPauseQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? currentPauseQueryKey(userId) : CURRENT_PAUSE_NONE_QUERY_KEY,
    queryFn: () => fetchCurrentPause(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  } as const;
}
