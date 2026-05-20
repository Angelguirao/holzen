/**
 * Pause TanStack query modules (imports Supabase). App hooks/screens only —
 * other features should use `@/features/pause/public` (no eager Supabase).
 */
export { getArchivePausesTabHasRowsQueryOptions } from './infrastructure/queries/archive/archive-pauses-tab-query';
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
} from './infrastructure/queries/archive/archive-list-query';
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
  deleteCompanionCacheRow,
  deleteCompanionCacheRowsByIds,
  deleteGenerationAttemptRowsByIds,
} from './infrastructure/queries/pause-admin-delete-mutations';
export {
  deleteCompanionFallback,
  insertCompanionFallbackEntry,
  setCompanionFallbackActive,
  swapCompanionFallbackSortOrder,
  updateCompanionFallbackPayload,
  type CompanionFallbackAdminMutationResult,
} from './infrastructure/queries/companion-fallbacks-admin-mutations';
export {
  ADMIN_COMPANION_FALLBACKS_QUERY_KEY,
  fetchCompanionFallbackRows,
  getAdminCompanionFallbacksQueryOptions,
  type CompanionFallbackRow,
  type FallbackPoolType,
} from './infrastructure/queries/companion-fallbacks-admin-query';
export {
  ADMIN_DEV_MODE_SETTING_NONE_QUERY_KEY,
  adminDevModeSettingQueryKey,
  fetchDevModeFromAnalytics,
  getAdminDevModeSettingQueryOptions,
  readLocalDevMode,
} from './infrastructure/queries/dev-mode-admin-query';
export {
  ADMIN_APPLIED_MIGRATIONS_QUERY_KEY,
  fetchAppliedMigrations,
  getAdminAppliedMigrationsQueryOptions,
  type AppliedMigrationRow,
} from './infrastructure/queries/applied-migrations-admin-query';
export {
  ADMIN_PROVIDER_HEALTH_QUERY_KEY,
  fetchProviderHealthStats,
  getProviderHealthQueryOptions,
  PROVIDER_HEALTH_ERROR_RATE_THRESHOLD,
  PROVIDER_HEALTH_MIN_SAMPLE,
  PROVIDER_HEALTH_WINDOW_MINUTES,
  type Provider,
  type ProviderStat,
} from './infrastructure/queries/provider-health-admin-query';
export {
  ADMIN_APP_CONFIG_TOOLS_QUERY_KEY,
  DEFAULTS,
  FEATURE_KEYS,
  fetchAppConfigToolsBundle,
  getAdminAppConfigToolsQueryOptions,
  type ConfigState,
  type FeatureKey,
  type SpendSnapshot,
} from './infrastructure/queries/app-config-admin-query';
export {
  DEFAULT_PREGENERATE_CACHE_TOPUP,
  PREGENERATE_CACHE_TOPUP_KEYS,
  mergePregenerateCacheTopup,
} from './domain/pregenerate-cache-topup-config';
export type {
  PregenerateCacheTopupConfig,
  PregenerateCacheTopupKey,
  PregenerateCacheTopupTypeConfig,
} from './domain/pregenerate-cache-topup-config';
export { upsertAppConfigRow } from './infrastructure/queries/app-config-admin-mutations';
export type { TimePeriod } from './domain/admin-time-period';
export {
  ADMIN_COST_GENERATION_ATTEMPTS_QUERY_PREFIX,
  ADMIN_COST_MRR_SNAPSHOT_QUERY_KEY,
  adminCostGenerationAttemptsQueryKey,
  fetchCostAnalyticsMrrSnapshot,
  fetchGenerationAttemptsForPeriod,
  getAdminCostGenerationAttempts7dShadowQueryOptions,
  getAdminCostGenerationAttemptsQueryOptions,
  getAdminCostMrrSnapshotQueryOptions,
  type AttemptRow as AdminCostAttemptRow,
  type MrrSnapshot,
} from './infrastructure/queries/cost-analytics-admin-query';
export {
  ADMIN_STATS_QUERY_KEY,
  fetchAdminStatsBundle,
  fetchAdminStatsCacheEntries,
  fetchAdminStatsCompanionCacheUi,
  fetchAdminStatsRejections,
  getAdminStatsBundleQueryOptions,
  type AdminStatsBundle,
  type CacheEntryRow,
  type CacheHitRow,
  type CostRow,
  type DailyFeedbackRow,
  type DailyFailureRow,
  type DailyNotificationRow,
  type DailyServeRow,
  type FailureRow,
  type FeedbackRow,
  type LibraryEntryRow,
  type RecentContentRow,
  type RejectionRow,
  type SessionRow,
  type SignalSourceRow,
} from './infrastructure/queries/stats-bundle-admin-query';
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
} from './infrastructure/queries/archive/archive-list-query';
export { invalidatePauseStatsDataForUser } from './application/queries/invalidate-pause-stats';
export { PAUSE_QUERY_PREFIX } from './application/queries/pause-query-namespace';
export {
  PAUSE_INSTANCE_QUERY_ROOT,
  pauseInstanceQueryPrefix,
} from './application/queries/pause-instance-query-prefix';
export {
  COMPANION_SLOT_FAVORITES_METADATA_KEY,
  COMPANION_LIBRARY_FAVORITES_NONE_QUERY_KEY,
  COMPANION_LIBRARY_FAVORITES_QUERY_LEAF,
  companionLibraryFavoritesQueryKey,
  fetchCompanionLibraryFavorites,
  getCompanionLibraryFavoritesQueryOptions,
  toggleCompanionLibraryFavorite,
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
export { fetchHaikuTextForPauseInstance } from './infrastructure/queries/reflect/haiku-artifact-query';
export {
  fetchOpeningMessageForPauseInstance,
  generateReflectionAtReflectStep,
  persistReflectionArtifacts,
  type PersistReflectionArtifactsParams,
} from './infrastructure/edge/reflect/reflection-artifact';
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
} from './infrastructure/edge/reflect/load-reflect-recency-hints';
export {
  fetchSettingsDataExportBundle,
  type SettingsDataExportBundle,
  type SettingsExportAiArtifact,
  type SettingsExportCompanionEvent,
  type SettingsExportPauseRow,
  type SettingsExportStepEvent,
} from './infrastructure/queries/settings-data-export-query';
