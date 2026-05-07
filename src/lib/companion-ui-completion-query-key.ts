import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';

/**
 * TanStack query key for companion ritual “step completed” flags
 * (`loadCompanionUiCompletionState` / `useCompanionData`).
 *
 * Lives in a key-only module so `pause-api` and breath RPC helpers can invalidate
 * without importing `companion-completion-sync` (which depends on `pause-api`).
 */
export function companionUiCompletionQueryKey(pauseInstanceId: string) {
  return ['pause', 'companion-ui-completion', pauseInstanceId] as const;
}

/** Marks the completion query stale so `useCompanionData` refetches from Supabase. */
export function invalidateCompanionUiCompletionQuery(pauseInstanceId: string): void {
  const qc = getHolzenQueryClient();
  if (!qc) return;
  void qc.invalidateQueries({ queryKey: companionUiCompletionQueryKey(pauseInstanceId) });
}
