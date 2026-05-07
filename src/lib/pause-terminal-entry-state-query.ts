import { supabase } from '@/integrations/supabase/client';
import type { PauseState } from '@/lib/pause-state';

export const PAUSE_TERMINAL_ENTRY_STATE_NONE_QUERY_KEY = ['pause', 'terminal-entry', 'db-state', 'none'] as const;

export function pauseTerminalEntryStateQueryKey(pauseInstanceId: string) {
  return ['pause', 'terminal-entry', 'db-state', pauseInstanceId] as const;
}

export async function fetchPauseInstanceStateForTerminalGuard(
  pauseInstanceId: string,
): Promise<PauseState | null> {
  const { data, error } = await supabase
    .from('pause_instances' as never)
    .select('state')
    .eq('id', pauseInstanceId)
    .maybeSingle();
  if (error) throw error;
  return (data as { state?: PauseState } | null)?.state ?? null;
}

export function getPauseTerminalEntryStateQueryOptions(input: {
  pauseInstanceId: string | null;
  enabled: boolean;
}) {
  const { pauseInstanceId, enabled } = input;
  return {
    queryKey: pauseInstanceId
      ? pauseTerminalEntryStateQueryKey(pauseInstanceId)
      : PAUSE_TERMINAL_ENTRY_STATE_NONE_QUERY_KEY,
    queryFn: () => fetchPauseInstanceStateForTerminalGuard(pauseInstanceId!),
    enabled: Boolean(pauseInstanceId) && enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
