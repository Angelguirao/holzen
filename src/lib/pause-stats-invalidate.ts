import { COMPLETED_PAUSE_COUNT_QUERY_KEY } from '@/hooks/use-completed-pause-count';
import { PAUSE_STATS_DATA_QUERY_KEY } from '@/hooks/use-pause-stats-data';
import { homePinnedPausePreviewQueryPrefix } from '@/hooks/use-home-pinned-pause-preview';
import { currentPauseQueryKey } from '@/hooks/use-current-pause';
import { pendingPauseOfferQueryKey } from '@/hooks/use-pending-pause-offer';
import { pauseArchiveListQueryPrefix } from '@/hooks/use-pause-archive-list';
import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';

/**
 * Call after a pause reaches `completed` so Home (Journey card), Journey → Stats,
 * completed-pause count (Profile / AI insights gate, Tools), Archive pause-tab presence
 * probe, Archive pause/echoes infinite lists (`usePauseArchiveList`), pending pause offer
 * (`usePendingPauseOffer`), current open pause (`useCurrentPause`),
 * Home pinned pause preview (`useHomePinnedPausePreview`), and badges re-read from Supabase
 * without waiting for the stats query `staleTime` window.
 */
export function invalidatePauseStatsDataForUser(userId: string | null | undefined): void {
  if (!userId) return;
  const qc = getHolzenQueryClient();
  if (!qc) return;
  void qc.invalidateQueries({ queryKey: PAUSE_STATS_DATA_QUERY_KEY(userId) });
  void qc.invalidateQueries({ queryKey: COMPLETED_PAUSE_COUNT_QUERY_KEY(userId) });
  void qc.invalidateQueries({ queryKey: ['archive', 'pauses-tab-has-rows', userId] });
  void qc.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: currentPauseQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: homePinnedPausePreviewQueryPrefix(userId) });
}
