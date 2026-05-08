import { supabase } from '@/integrations/supabase/client';
import type { RegenerateCompanionSlot } from '@/lib/companion-orchestrate-types';

/**
 * Maps an internal orchestrator slot name to the `kind` value persisted
 * in `pause_ai_artifacts.kind`.
 */
const DB_TYPE: Record<RegenerateCompanionSlot, string> = {
  signal: 'signal',
  grounding: 'ground_nudge',
  history: 'historical_insight',
  zoomOut: 'zoom_out_deep_time',
};

export interface HistoryThreadRow {
  id: string;
  pause_instance_id: string;
  created_at: string | null;
  content: { title?: string; body?: string; btcInsight?: string } | null;
}

export const HISTORY_THREAD_QUERY_PREFIX = ['history-thread'] as const;

export const HISTORY_THREAD_DISABLED_USER_ID = 'none' as const;

export const HISTORY_THREAD_NONE_QUERY_KEY = [
  ...HISTORY_THREAD_QUERY_PREFIX,
  HISTORY_THREAD_DISABLED_USER_ID,
] as const;

export function historyThreadQueryKey(userId: string, companion: RegenerateCompanionSlot, limit: number) {
  return [...HISTORY_THREAD_QUERY_PREFIX, userId, companion, limit] as const;
}

export async function fetchHistoryThreadRows(
  userId: string,
  companion: RegenerateCompanionSlot,
  limit: number,
): Promise<HistoryThreadRow[]> {
  const { data, error } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('id, pause_instance_id, created_at, content')
    .eq('user_id', userId)
    .eq('kind', DB_TYPE[companion])
    .order('created_at', { ascending: false })
    .limit(limit + 1);
  if (error || !data) return [];
  return data as unknown as HistoryThreadRow[];
}

export function getHistoryThreadQueryOptions(input: {
  userId: string | undefined;
  companion: RegenerateCompanionSlot;
  limit: number;
}) {
  const { userId, companion, limit } = input;
  return {
    queryKey: userId ? historyThreadQueryKey(userId, companion, limit) : HISTORY_THREAD_NONE_QUERY_KEY,
    queryFn: () => fetchHistoryThreadRows(userId!, companion, limit),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
