/**
 * Pause TanStack query modules (imports Supabase). App hooks/screens only —
 * other features should use `@/features/pause/public` (no eager Supabase).
 */
export { getArchivePausesTabHasRowsQueryOptions } from './infrastructure/queries/archive-pauses-tab-query';
export {
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
  fetchCompletedPauseCount,
  getCompletedPauseCountQueryOptions,
} from './infrastructure/queries/completed-pause-count-query';
export {
  buildMemberCacheKey,
  getLibraryBundleDisabledQueryOptions,
  getLibraryBundleQueryOptions,
  libraryBundleQueryPrefix,
  sortMemberPauses,
} from './infrastructure/queries/library-bundle-query';
export type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
  LibraryListSortMode,
} from './domain/library-bundle';
export {
  currentPauseQueryKey,
  getCurrentPauseQueryOptions,
  type CurrentPauseRow,
} from './infrastructure/queries/current-pause-query';
export {
  getPendingPauseOfferQueryOptions,
  pendingPauseOfferQueryKey,
  type PendingPauseOfferRow,
} from './infrastructure/queries/pending-pause-offer-query';
export {
  type PauseArchiveListSort,
  type PauseArchiveRow,
  type PauseArchiveSegment,
} from './infrastructure/queries/archive-list-query';
export {
  getHistoryThreadQueryOptions,
  type HistoryThreadRow,
} from './infrastructure/queries/history-thread-query';
export {
  companionFeedbackVoteQueryKey,
  getCompanionFeedbackVoteQueryOptions,
} from './infrastructure/queries/companion-feedback-vote-query';
export {
  BULK_HOLD_PENDING_DISABLED_USER_ID,
  BULK_HOLD_PENDING_QUERY_LEAF,
  BULK_HOLD_PENDING_QUERY_PREFIX,
  bulkHoldPendingNoneQueryKey,
  bulkHoldPendingQueryKey,
  fetchBulkHoldPendingPauses,
  getBulkHoldPendingQueryOptions,
  PAUSE_BULK_HOLD_QUERY_PREFIX,
} from './infrastructure/queries/bulk-hold-pending-query';
