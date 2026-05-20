import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hapticFeedback } from '@/lib/haptics';
import {
  EMPTY_COMPANION_UI_COMPLETION,
  getCompanionUiCompletionQueryOptions,
  type CompanionUiCompletionStep,
  type CompanionUiCompletionState,
} from '@/features/pause/public-queries';
import { persistCompanionUiStepCompletion } from '@/features/pause/public-rpc';
import { companionUiCompletionQueryKey } from '@/features/pause/application/queries/companion-ui-completion-query-key';

/**
 * Per-pause-instance companion UI step completion (TanStack Query + RPC persist).
 */
export function useCompanionUiCompletion(pauseInstanceId?: string | null) {
  const queryClient = useQueryClient();
  const completionQuery = useQuery(getCompanionUiCompletionQueryOptions(pauseInstanceId));
  const completion = completionQuery.data ?? EMPTY_COMPANION_UI_COMPLETION;

  const markCompleted = useCallback(
    async (key: CompanionUiCompletionStep) => {
      const id = pauseInstanceId;
      if (!id) return;
      const keyFull = companionUiCompletionQueryKey(id);
      const snap =
        queryClient.getQueryData<CompanionUiCompletionState>(keyFull) ??
        completionQuery.data ??
        EMPTY_COMPANION_UI_COMPLETION;
      if (snap[key]) return;
      queryClient.setQueryData<CompanionUiCompletionState>(keyFull, { ...snap, [key]: true });
      hapticFeedback('light');
      await persistCompanionUiStepCompletion(id, key);
    },
    [pauseInstanceId, queryClient, completionQuery.data],
  );

  return { completion, markCompleted };
}
