import { COMPLETED_PAUSE_COUNT_QUERY_KEY } from '@/lib/completed-pause-count-query';
import { currentPauseQueryKey } from '@/lib/current-pause-query';
import { homePinnedPausePreviewQueryPrefix } from '@/lib/home-pinned-pause-preview-query';
import { libraryBundleQueryPrefix } from '@/lib/library-bundle-query';
import { pauseArchiveListQueryPrefix } from '@/lib/pause-archive-list-query';
import { PAUSE_STATS_DATA_QUERY_KEY } from '@/lib/pause-stats-data-query';
import { pendingPauseOfferQueryKey } from '@/lib/pending-pause-offer-query';
import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';
import { archivePausesTabHasRowsQueryPrefix } from '@/lib/archive-pauses-tab-query';
import { invalidateHistoryCalendarActivities } from '@/lib/history-calendar-activities-query-key';

/**
 * Call after a pause reaches `completed` so Home (Journey card), Journey → Stats,
 * completed-pause count (Profile / AI insights gate, Tools), Archive pause-tab presence
 * probe, Archive pause/echoes infinite lists (`usePauseArchiveList`), library collections
 * bundle (`useLibrary`), pending pause offer (`usePendingPauseOffer`), current open pause
 * (`useCurrentPause`), Home pinned pause preview (`useHomePinnedPausePreview`), Journey
 * activity calendar (`HistoryContent`). **Badges** reuse the same pause-stats bundle
 * (`usePauseStatsData` → `useBadges`); invalidating this key refetches rows so
 * `computeBadges` runs again (see `docs/systems/badges-system.md`).
 */
export function invalidatePauseStatsDataForUser(userId: string | null | undefined): void {
  if (!userId) return;
  const qc = getHolzenQueryClient();
  if (!qc) return;
  invalidateHistoryCalendarActivities(qc, userId);
  void qc.invalidateQueries({ queryKey: PAUSE_STATS_DATA_QUERY_KEY(userId) });
  void qc.invalidateQueries({ queryKey: COMPLETED_PAUSE_COUNT_QUERY_KEY(userId) });
  void qc.invalidateQueries({ queryKey: archivePausesTabHasRowsQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: libraryBundleQueryPrefix(userId) });
  void qc.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: currentPauseQueryKey(userId) });
  void qc.invalidateQueries({ queryKey: homePinnedPausePreviewQueryPrefix(userId) });
}
