import { loadCompanionUiCompletionState } from '@/lib/companion-completion-sync';
import { companionUiCompletionQueryKey } from '@/lib/companion-ui-completion-query-key';

export const COMPANION_UI_COMPLETION_NONE_QUERY_KEY = ['pause', 'companion-ui-completion', 'none'] as const;

/** Shared TanStack options for ritual step completion flags (`pause_step_events` / `pause_companion_events`). */
export function getCompanionUiCompletionQueryOptions(pauseInstanceId: string | null | undefined) {
  return {
    queryKey: pauseInstanceId
      ? companionUiCompletionQueryKey(pauseInstanceId)
      : COMPANION_UI_COMPLETION_NONE_QUERY_KEY,
    queryFn: () => loadCompanionUiCompletionState(pauseInstanceId!),
    enabled: Boolean(pauseInstanceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
