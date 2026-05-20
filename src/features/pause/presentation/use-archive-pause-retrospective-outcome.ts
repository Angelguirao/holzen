import { useCallback, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { trackPauseOutcomeRetrospective } from '@/features/pause/application/use-cases/archive/archive-retrospective-telemetry';
import { hapticFeedback } from '@/lib/haptics';
import { invalidatePauseStatsDataForUser } from '@/features/pause/public-queries';
import { logRetrospectiveOutcome } from '@/features/pause/public-rpc';

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
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const submit = useCallback(
    async (outcome: string) => {
      if (!instanceId || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        hapticFeedback('medium');
        await logRetrospectiveOutcome({ instanceId, outcome });
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
        setSubmitting(false);
      }
    },
    [instanceId, onOpenChange, onSuccess, t, userId],
  );

  const handleDecide = useCallback(
    (outcome: string) => {
      void submit(outcome);
    },
    [submit],
  );

  return { submitting, handleDecide };
}
