import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';
import { PAUSE_QUERY_PREFIX } from './pause-query-namespace';

/**
 * TanStack query key for companion ritual “step completed” flags
 * (`loadCompanionUiCompletionState` / `useCompanionData`).
 *
 * Lives in a key-only module so RPC helpers can invalidate without importing
 * `companion-completion-sync` (which depends on `public-rpc`).
 */
export const COMPANION_UI_COMPLETION_QUERY_LEAF = 'companion-ui-completion' as const;

export const COMPANION_UI_COMPLETION_QUERY_PREFIX = [
  ...PAUSE_QUERY_PREFIX,
  COMPANION_UI_COMPLETION_QUERY_LEAF,
] as const;

export const COMPANION_UI_COMPLETION_DISABLED_INSTANCE_ID = 'none' as const;

export const COMPANION_UI_COMPLETION_NONE_QUERY_KEY = [
  ...COMPANION_UI_COMPLETION_QUERY_PREFIX,
  COMPANION_UI_COMPLETION_DISABLED_INSTANCE_ID,
] as const;

export function companionUiCompletionQueryKey(pauseInstanceId: string) {
  return [...COMPANION_UI_COMPLETION_QUERY_PREFIX, pauseInstanceId] as const;
}

/** Marks the completion query stale so `useCompanionData` refetches from Supabase. */
export function invalidateCompanionUiCompletionQuery(pauseInstanceId: string): void {
  const qc = getHolzenQueryClient();
  if (!qc) return;
  void qc.invalidateQueries({ queryKey: companionUiCompletionQueryKey(pauseInstanceId) });
}
