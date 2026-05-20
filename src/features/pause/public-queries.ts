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
  fetchPauseInstancesForJourney,
  getJourneyPauseInstancesQueryOptions,
  journeyPauseInstancesQueryKey,
  type JourneyPauseRow,
} from './infrastructure/queries/journey-pause-instances-query';
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
  logCompanionFeedbackVote,
} from './infrastructure/queries/companion-feedback-vote-query';
export {
  insertPauseAnalyticsEvent,
  logCompanionFullviewOpened,
  logDevModeSetting,
  type CompanionFullviewKind,
} from './infrastructure/analytics-events';
export {
  demoteCompanionCacheEntry,
  promoteCompanionCacheEntry,
  setCompanionCacheSourceUntrusted,
  type CompanionCacheAdminMutationResult,
} from './infrastructure/queries/companion-cache-admin-mutations';
export {
  deleteCompanionFallback,
  insertCompanionFallbackEntry,
  setCompanionFallbackActive,
  swapCompanionFallbackSortOrder,
  updateCompanionFallbackPayload,
  type CompanionFallbackAdminMutationResult,
} from './infrastructure/queries/companion-fallbacks-admin-mutations';
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
export {
  PAUSE_ARCHIVE_LIST_QUERY_PREFIX,
  PAUSE_ARCHIVE_PAGE_SIZE,
  fetchPauseArchivePage,
  getPauseArchiveInfiniteQueryDefaults,
  pauseArchiveInfiniteQueryKey,
  pauseArchiveListQueryPrefix,
  pauseArchiveStorageCacheKey,
} from './infrastructure/queries/archive-list-query';
export {
  COMPANION_SLOT_FAVORITES_METADATA_KEY,
  COMPANION_LIBRARY_FAVORITES_NONE_QUERY_KEY,
  COMPANION_LIBRARY_FAVORITES_QUERY_LEAF,
  companionLibraryFavoritesQueryKey,
  fetchCompanionLibraryFavorites,
  getCompanionLibraryFavoritesQueryOptions,
} from './infrastructure/queries/companion-library-favorites-query';
export {
  fetchParsedPauseArtifactCache,
  type CachedGroundingShape,
  type CachedSignalShape,
  type CachedZoomOutShape,
  type ParsedPauseArtifactCache,
} from './infrastructure/queries/artifact-cache-query';
export {
  COMPANION_UI_COMPLETION_NONE_QUERY_KEY,
  getCompanionUiCompletionQueryOptions,
} from './infrastructure/queries/companion-ui-completion-query';
export {
  EMPTY_COMPANION_UI_COMPLETION,
  loadCompanionUiCompletionState,
  persistCompanionUiStepCompletion,
  type CompanionUiCompletionState,
  type CompanionUiCompletionStep,
} from './infrastructure/companion/companion-ui-completion-sync';
export {
  getPauseTerminalEntryStateQueryOptions,
  pauseTerminalEntryStateQueryKey,
} from './infrastructure/queries/terminal-entry-state-query';
export {
  getPauseSessionFetchedInstanceQueryOptions,
  pauseSessionFetchedInstanceQueryKey,
} from './infrastructure/queries/session-fetched-instance-query';
export {
  getPauseSessionCompanionSnapshotQueryOptions,
  loadPauseSessionSnapshot,
  pauseSessionCompanionSnapshotQueryKey,
  type PauseSessionSnapshot,
} from './infrastructure/queries/companion-session-snapshot-query';
export {
  fetchLatestPauseReflectStep,
  getLatestPauseReflectNoteQueryOptions,
  getLatestPauseReflectTagsQueryOptions,
  noteTextFromReflectRow,
  PAUSE_REFLECT_STEP_NOTE,
  PAUSE_REFLECT_STEP_QUERY_PREFIX,
  PAUSE_REFLECT_STEP_TAGS,
  pauseReflectStepLatestQueryKey,
  tagsFromReflectRow,
  type PauseReflectStepLatestRow,
  type PauseReflectStepType,
} from './infrastructure/queries/reflect-step-query';
export { fetchHaikuTextForPauseInstance } from './infrastructure/queries/haiku-artifact-query';
export {
  fetchOpeningMessageForPauseInstance,
  generateReflectionAtReflectStep,
  persistReflectionArtifacts,
  type PersistReflectionArtifactsParams,
} from './infrastructure/reflect/reflection-artifact';
export {
  fetchOpenPauseHomePreview,
  type OpenPauseHomePreview,
} from './infrastructure/queries/open-pause-home-preview-query';
export {
  GROUNDING_ENRICHMENT_DISABLED_QUERY_KEY,
  GROUNDING_ENRICHMENT_DISABLED_SEGMENT,
  GROUNDING_ENRICHMENT_QUERY_PREFIX,
  fetchGroundingEnrichment,
  getGroundingEnrichmentQueryOptions,
  groundingEnrichmentQueryKey,
  type GroundingEnrichment,
  type GroundingEnrichmentInput,
} from './infrastructure/queries/grounding-enrichment-query';
export {
  RELATED_BIASES_GROUND_NUDGE_DISABLED_USER_ID,
  RELATED_BIASES_GROUND_NUDGE_NONE_QUERY_KEY,
  RELATED_BIASES_GROUND_NUDGE_QUERY_PREFIX,
  fetchGroundNudgeArtifactsLast30d,
  getRelatedBiasesGroundNudgeQueryOptions,
  relatedBiasesGroundNudgeQueryKey,
} from './infrastructure/queries/related-biases-ground-nudge-query';
export { loadMoodHistoryForOrchestrate } from './infrastructure/companion/mood-history';
export { loadActiveOrchestrateSources } from './infrastructure/companion/orchestrate-sources';
export {
  loadReflectRecencyHints,
  type ReflectMoodHistoryEntry,
  type ReflectRecencyHints,
} from './infrastructure/reflect/load-reflect-recency-hints';
