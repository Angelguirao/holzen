import { pauseArchiveListQueryPrefix } from '@/features/pause/application/queries/archive-query-keys';
import { journeyPauseInstancesQueryKey } from './journey-pause-instances-keys';
import { COMPLETED_PAUSE_COUNT_QUERY_KEY } from './completed-pause-count-keys';
import { currentPauseQueryKey } from './current-pause-keys';
import { pendingPauseOfferQueryKey } from './pending-pause-offer-keys';
import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';
import { archivePausesTabHasRowsQueryPrefix } from './archive-pauses-tab-keys';

/**
 * Call after a pause reaches `completed` so Home, Journey overview, completed-pause count,
 * Archive lists, pending offer, and current open pause stay fresh.
 */
export function invalidatePauseStatsDataForUser(userId: string | null | undefined): void {
  if (!userId) return;
  const qc = getHolzenQueryClient();
  if (!qc) return;
  void qc.invalidateQueries({ queryKey: journeyPauseInstancesQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: COMPLETED_PAUSE_COUNT_QUERY_KEY(userId) });
  void qc.invalidateQueries({ queryKey: archivePausesTabHasRowsQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: currentPauseQueryKey(userId) });
}
