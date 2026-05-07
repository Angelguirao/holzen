/**
 * TanStack query key for companion ritual “step completed” flags
 * (`loadCompanionUiCompletionState` / `useCompanionData`).
 *
 * Lives in a key-only module so `pause-api` can invalidate on pause completion
 * without importing `companion-completion-sync` (which depends on `pause-api`).
 */
export function companionUiCompletionQueryKey(pauseInstanceId: string) {
  return ['pause', 'companion-ui-completion', pauseInstanceId] as const;
}
