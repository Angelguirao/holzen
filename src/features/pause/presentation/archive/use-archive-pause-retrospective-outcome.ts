import { useCallback, useRef, useTransition } from 'react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { hapticFeedback } from '@/lib/haptics';
import { invalidatePauseStatsDataForUser } from '@/features/pause/public-queries';
import {
  pauseArchiveLogRetrospectiveOutcome,
  trackPauseOutcomeRetrospective,
} from './pause-archive-io';

export type UseArchivePauseRetrospectiveOutcomeParams = {
  instanceId: string | null | undefined;
  userId: string | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
  t: TFunction;
};

/** Archive sheet — log retrospective `outcome_logged` for expired/dismissed pauses. */
export function useArchivePauseRetrospectiveOutcome({
  instanceId,
  userId,
  onOpenChange,
  onSuccess,
  t,
}: UseArchivePauseRetrospectiveOutcomeParams) {
  const [isPending, startTransition] = useTransition();
  const submittingRef = useRef(false);

  const handleDecide = useCallback(
    (outcome: string) => {
      if (!instanceId || submittingRef.current) return;
      submittingRef.current = true;
      startTransition(async () => {
        try {
          hapticFeedback('medium');
          await pauseArchiveLogRetrospectiveOutcome({ instanceId, outcome });
          trackPauseOutcomeRetrospective({ pauseInstanceId: instanceId, outcome });
          invalidatePauseStatsDataForUser(userId);
          hapticFeedback('success');
          toast.success(
            t('archive.retrospectiveOutcomeSaved', { defaultValue: 'Decision saved for this pause.' }),
          );
          onOpenChange(false);
          await onSuccess?.();
        } catch {
          hapticFeedback('warning');
          toast.error(
            t('archive.retrospectiveOutcomeFailed', {
              defaultValue: 'Could not save — check your connection and try again.',
            }),
          );
        } finally {
          submittingRef.current = false;
        }
      });
    },
    [instanceId, onOpenChange, onSuccess, t, userId, startTransition],
  );

  return { submitting: isPending, handleDecide };
}
