import { COMPLETED_PAUSE_COUNT_QUERY_KEY } from '@/lib/completed-pause-count-query';
import { currentPauseQueryKey } from '@/lib/current-pause-query';
import { libraryBundleQueryPrefix } from '@/lib/library-bundle-query';
import { pauseArchiveListQueryPrefix } from '@/lib/pause-archive-list-query';
import { pendingPauseOfferQueryKey } from '@/lib/pending-pause-offer-query';
import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';
import { archivePausesTabHasRowsQueryPrefix } from '@/lib/archive-pauses-tab-query';
/**
 * Call after a pause reaches `completed` so Home, Journey overview, completed-pause count,
 * Archive lists, library bundle, pending offer, and current open pause stay fresh.
 */
export function invalidatePauseStatsDataForUser(userId: string | null | undefined): void {
  if (!userId) return;
  const qc = getHolzenQueryClient();
  if (!qc) return;
  void qc.invalidateQueries({ queryKey: ['journey', 'pause-instances', userId] });
  void qc.invalidateQueries({ queryKey: COMPLETED_PAUSE_COUNT_QUERY_KEY(userId) });
  void qc.invalidateQueries({ queryKey: archivePausesTabHasRowsQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: libraryBundleQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: currentPauseQueryKey(userId) });
}
