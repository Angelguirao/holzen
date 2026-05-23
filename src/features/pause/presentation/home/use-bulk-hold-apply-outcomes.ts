import { useCallback, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import { hapticFeedback } from '@/lib/haptics';
import type {
  BulkHoldOutcomeChoice,
  BulkHoldPendingPause,
} from '@/features/pause/domain/bulk-hold';
import { pauseApplyBulkHoldOutcomes } from '@/features/pause/presentation/home/pause-home-bulk-hold-io';
import { invalidatePauseStatsDataForUser } from '@/features/pause/public-queries';

export type UseBulkHoldApplyOutcomesParams = {
  user: User | null;
  setPending: (rows: BulkHoldPendingPause[]) => void;
  bumpRefetchNonce: () => void;
  t: TFunction;
  onSuccess: (heldCount: number) => void;
  onPartial: (failedRows: BulkHoldPendingPause[]) => void;
};

/** Home bulk-hold sheet — apply retrospective outcomes via `pause_log_step` RPC. */
export function useBulkHoldApplyOutcomes({
  user,
  setPending,
  bumpRefetchNonce,
  t,
  onSuccess,
  onPartial,
}: UseBulkHoldApplyOutcomesParams) {
  const [isPending, startTransition] = useTransition();
  const [applyError, setApplyError] = useState<string | null>(null);

  const applyOutcomesAndFinish = useCallback(
    (rows: BulkHoldPendingPause[], resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice) => {
      if (!user || rows.length === 0) return;

      startTransition(async () => {
        setApplyError(null);
        hapticFeedback('medium');

        const result = await pauseApplyBulkHoldOutcomes(rows, resolver);

        if (result.status === 'failed') {
          hapticFeedback('warning');
          setApplyError(t('bulkHold.applyFailed'));
          bumpRefetchNonce();
          return;
        }

        if (result.status === 'partial') {
          hapticFeedback('warning');
          setPending(result.failedRows);
          onPartial(result.failedRows);
          setApplyError(t('bulkHold.applyPartialFailed', { count: result.failedRows.length }));
          invalidatePauseStatsDataForUser(user.id);
          return;
        }

        hapticFeedback('success');
        setPending([]);
        setApplyError(null);
        onSuccess(result.count);
        invalidatePauseStatsDataForUser(user.id);
      });
    },
    [user, t, setPending, bumpRefetchNonce, onSuccess, onPartial, startTransition],
  );

  return {
    loading: isPending,
    applyError,
    setApplyError,
    applyOutcomesAndFinish,
  };
}
