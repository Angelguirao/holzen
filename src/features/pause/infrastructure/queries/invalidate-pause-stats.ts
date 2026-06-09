import { pauseArchiveListQueryPrefix } from '@/features/pause/infrastructure/queries/archive/archive-query-keys';
import { journeyPauseInstancesQueryKey } from './journey-pause-instances-query-key';
import { PRACTICE_SUMMARY_QUERY_KEY } from './practice-summary-query-key';
import { currentPauseQueryKey } from './current-pause-query-key';
import { pendingPauseOfferQueryKey } from '@/features/pause/infrastructure/queries/reflect/pending-offer/pending-pause-offer-query-key';
import { HOLZEN_NUMBER_QUERY_KEY } from '@/features/user/infrastructure/queries/holzen-number-query';
import { getHolzenQueryClient } from '../holzen-query-client-ref';
import { archivePausesTabHasRowsQueryPrefix } from '@/features/pause/infrastructure/queries/archive/archive-pauses-tab-keys';
import { pauseInstancePracticeXpQueryKey } from './pause-instance-practice-xp-query';

export type InvalidatePauseStatsOptions = {
  /** When set, also refreshes Done `practice_xp_awarded` for this pause instance. */
  pauseInstanceId?: string | null;
};

/**
 * Call after a pause reaches `completed` (or practice XP is recomputed) so Home,
 * Journey overview, Archive lists, pending offer, current open pause, Done Presence row,
 * and the public “paused today” aggregate stay fresh.
 */
export function invalidatePauseStatsDataForUser(
  userId: string | null | undefined,
  options?: InvalidatePauseStatsOptions,
): void {
  if (!userId) return;
  const qc = getHolzenQueryClient();
  if (!qc) return;
  void qc.invalidateQueries({ queryKey: HOLZEN_NUMBER_QUERY_KEY });
  void qc.invalidateQueries({ queryKey: journeyPauseInstancesQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: PRACTICE_SUMMARY_QUERY_KEY(userId) });
  void qc.invalidateQueries({ queryKey: archivePausesTabHasRowsQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: currentPauseQueryKey(userId) });

  const pauseInstanceId = options?.pauseInstanceId;
  if (pauseInstanceId) {
    void qc.invalidateQueries({ queryKey: pauseInstancePracticeXpQueryKey(pauseInstanceId) });
  }
}
