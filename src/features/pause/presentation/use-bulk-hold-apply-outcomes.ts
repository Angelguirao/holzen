import { useCallback, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import { hapticFeedback } from '@/lib/haptics';
import {
  invalidatePauseStatsDataForUser,
  type BulkHoldOutcomeChoice,
  type BulkHoldPendingPause,
} from '@/features/pause/public';
import { applyBulkHoldOutcomes } from '@/features/pause/public-rpc';

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
  const [loading, setLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const applyOutcomesAndFinish = useCallback(
    async (rows: BulkHoldPendingPause[], resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice) => {
      if (!user || rows.length === 0) return;

      setLoading(true);
      setApplyError(null);
      hapticFeedback('medium');

      const result = await applyBulkHoldOutcomes(rows, resolver);

      if (result.status === 'failed') {
        hapticFeedback('warning');
        setApplyError(t('bulkHold.applyFailed'));
        bumpRefetchNonce();
        setLoading(false);
        return;
      }

      if (result.status === 'partial') {
        hapticFeedback('warning');
        setPending(result.failedRows);
        onPartial(result.failedRows);
        setApplyError(t('bulkHold.applyPartialFailed', { count: result.failedRows.length }));
        setLoading(false);
        invalidatePauseStatsDataForUser(user.id);
        return;
      }

      hapticFeedback('success');
      setPending([]);
      setApplyError(null);
      onSuccess(result.count);
      setLoading(false);
      invalidatePauseStatsDataForUser(user.id);
    },
    [user, t, setPending, bumpRefetchNonce, onSuccess, onPartial],
  );

  return {
    loading,
    applyError,
    setApplyError,
    applyOutcomesAndFinish,
  };
}
