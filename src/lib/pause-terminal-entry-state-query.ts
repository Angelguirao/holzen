import { supabase } from '@/integrations/supabase/client';
import type { PauseState } from '@/lib/pause-state';
import { PAUSE_QUERY_PREFIX } from '@/lib/pause-query-namespace';

export const PAUSE_TERMINAL_ENTRY_SCOPE_PREFIX = [...PAUSE_QUERY_PREFIX, 'terminal-entry'] as const;

export const PAUSE_TERMINAL_ENTRY_STATE_QUERY_LEAF = 'db-state' as const;

export const PAUSE_TERMINAL_ENTRY_STATE_QUERY_PREFIX = [
  ...PAUSE_TERMINAL_ENTRY_SCOPE_PREFIX,
  PAUSE_TERMINAL_ENTRY_STATE_QUERY_LEAF,
] as const;

export const PAUSE_TERMINAL_ENTRY_STATE_DISABLED_INSTANCE_ID = 'none' as const;

export const PAUSE_TERMINAL_ENTRY_STATE_NONE_QUERY_KEY = [
  ...PAUSE_TERMINAL_ENTRY_STATE_QUERY_PREFIX,
  PAUSE_TERMINAL_ENTRY_STATE_DISABLED_INSTANCE_ID,
] as const;

export function pauseTerminalEntryStateQueryKey(pauseInstanceId: string) {
  return [...PAUSE_TERMINAL_ENTRY_STATE_QUERY_PREFIX, pauseInstanceId] as const;
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
