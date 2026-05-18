import { loadCompanionUiCompletionState } from '@/features/pause/infrastructure/companion/companion-ui-completion-sync';
import {
  COMPANION_UI_COMPLETION_NONE_QUERY_KEY,
  companionUiCompletionQueryKey,
} from '@/features/pause/application/queries/companion-ui-completion-query-key';

export { COMPANION_UI_COMPLETION_NONE_QUERY_KEY };

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
