/**
 * Public API for the pause bounded context (no Supabase eager load).
 * RPC mutations: `@/features/pause/public-rpc`.
 */
export { pauseCreateSkippedUserMessage } from './application/use-cases/create-skipped-message';
export {
  buildPauseImpactDataOnComplete,
  type BuildPauseImpactDataOnCompleteInput,
  type PauseImpactData,
} from './application/use-cases/impact-data';
export { pauseArchiveRowAllowsRetrospectiveOutcome } from './application/use-cases/archive/retrospective-outcome';
export { buildOutcomeLoggedPayload } from './application/use-cases/outcome-log-payload';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
} from './application/use-cases/pending-offer/pending-pause-offer-display';
export { groupBulkHoldByLocalDay } from './application/use-cases/bulk-hold/group-by-local-day';
export {
  bulkHoldMaxRows,
  bulkHoldQueryWindowIso,
  formatBulkHoldContextQuote,
  formatBulkHoldLocalTime,
  parseBulkHoldChange24hPct,
  type BulkHoldOutcomeChoice,
  type BulkHoldPendingPause,
  type BulkHoldReviewSection,
} from './domain/bulk-hold';
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from './application/use-cases/breathing/breath-second-label-variant';
export {
  BRIEF_PAUSE_ORDER,
  computeBriefMacroProgressPosition,
} from './domain/brief-ritual-steps';
export {
  computeBriefRitualGoBack,
  type BriefRitualGoBackResult,
} from './application/use-cases/ritual/brief/brief-pause-go-back';
export {
  computeBriefPastStepClick,
  type BriefPastStepClickResult,
} from './application/use-cases/ritual/brief/brief-pause-past-step-click';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './application/use-cases/session/persisted-session-guards';
export {
  TERMINAL_PAUSE_DB_STATES,
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
} from './application/use-cases/session/terminal-entry-guard';
export {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from './domain/manual-pause-trigger-result';
export {
  PAUSE_RITUAL_SCHEMA_VERSION,
  type BriefPauseStep,
  type RitualDepth,
} from './domain/ritual-types';
export {
  type FetchedPauseInstance,
  type PersistedSession,
} from './domain/session-model';
export { migratePersistedPauseSession } from './application/use-cases/session/migrate-persisted-session';
export {
  clearSession,
  loadSession,
  saveSession,
} from './infrastructure/session/persisted-session-storage';
export { resolveBreathOrbVisualMetrics } from './application/use-cases/breathing/pause-breath-orb-metrics';
export {
  resolveTriangleKickerDisplay,
  type TriangleKickerDisplay,
} from './application/use-cases/breathing/resolve-triangle-kicker-display';
export {
  effectivePauseShiftIntensity,
  effectivePauseShiftMood,
  hasPauseShiftOrPostEmotion,
  type PauseEmotionFields,
} from './domain/effective-emotion';
export {
  bucketChangePercent,
  computeContextFingerprint,
} from './domain/pause-fingerprint';
export {
  PAUSE_QUALITY_WEIGHTS,
  computePauseQualityScore,
  type PauseQualityBreakdown,
} from './domain/pause-quality';
export {
  buildFetchedPauseInstanceFromFetch,
  type PauseAiArtifactKindRow,
  type PauseInstanceContextSnapshotRow,
} from './application/use-cases/session/fetched-instance-from-fetch';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from './application/use-cases/session/storage-ritual-sync';
export type {
  CompanionOrchestrateSlotResult,
  CompanionSlotSource,
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
  RegenerateCompanionSlot,
} from './domain/companion-orchestrate';
export { COMPANION_TYPES, FEEDBACK_TO_CACHE_TYPE } from './domain/companion-types';
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
export type { FeelStepTile } from './domain/feel-step-tile';
export type { MoodValue } from './domain/mood-value';
export {
  isPauseMoodValue,
  PAUSE_MOOD_VALUES,
  PAUSE_MOOD_GROUPS,
} from './domain/mood-value';
export {
  PAUSE_DEEP_RITUAL_STEPS,
  PAUSE_DEEP_DISPLAY_STEP_COUNT,
  STEPS,
  pauseDeepDisplayProgressIndex,
  pauseDeepMacroStepNumber,
  type PauseStep,
} from './domain/pause-ritual-steps';
export type { CompanionData, CompanionPrefs } from './domain/companion-card-types';
export type { PauseSessionShellHolzen } from './domain/pause-session-shell-holzen';
export type {
  CachedHistoricalInsightShape,
} from './domain/historical-insight';
export {
  type NotificationNavigateState,
  type PauseSessionLocationState,
  type PauseSessionNavParsed,
  type PauseSeverity,
  parsePauseSessionLocationState,
} from './application/use-cases/session/location-state';
export { canNavigateToPauseSession } from './application/use-cases/session/can-navigate-to-pause-session';
export {
  buildHomePauseSessionLocationState,
  type BuildHomePauseSessionLocationStateInput,
} from './application/use-cases/session/build-home-pause-session-location-state';
export { shouldNavigateAfterManualTrigger } from './application/use-cases/trigger/should-navigate-after-manual-trigger';
export {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './application/use-cases/session/pause-holzen-providers-slice';
export {
  isLikelyPriceOnlyMarketError,
  pauseHomeErrorKind,
  pauseHomeErrorStrings,
  shouldShowHomePauseSectionSnooze,
  shouldSurfacePauseWidgetError,
  type PauseHomeErrorKind,
} from './application/use-cases/home/pause-home-widget-error';
export {
  millisecondsUntilNextQuarterHour,
  PAUSE_CRON_QUARTER_INTERVAL_MS,
} from './application/use-cases/scheduling/milliseconds-until-next-quarter-hour';
export {
  zenModeHomePauseSnapshot,
  ZEN_MODE_HOME_COMPANION_PREFS,
} from './application/use-cases/home/zen-mode-home-pause-snapshot';
export {
  resolvePauseArrivalToneAction,
  type PauseArrivalToneAction,
} from './application/use-cases/home/resolve-pause-arrival-tone-action';
export {
  buildHomePauseCardBodyProps,
  type BuildHomePauseCardBodyPropsInput,
  type HomePauseCardBodyPropsProjection,
  type PauseContextHomePreview,
} from './application/use-cases/home/home-pause-card-body-props';
export {
  buildZenModeHomeRouteProps,
  type BuildZenModeHomeRoutePropsInput,
  type ZenModeHomeRoutePropsProjection,
} from './application/use-cases/home/build-zen-mode-home-route-props';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
} from './application/use-cases/session/header-back';
export {
  BRIEF_SWITCH_TO_DEEP_STEP,
  briefSwitchToDeepPauseState,
  type BriefSwitchToDeepPauseState,
} from './application/use-cases/ritual/deep/brief-switch-to-deep';
export {
  briefStepToPauseScienceStep,
  mapPersistedStep,
  initialRitualEntry,
  initialBriefPauseStepFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialSelectedBriefFaceFromRestored,
  initialPhaseFromRestored,
  initialDecisionFromRestored,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialFrameDoneFromRestored,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
} from './application/use-cases/session/step-map';
export { coalescePauseSessionShellViewModel } from './application/use-cases/session/shell-view-model';
export {
  isPauseSessionDepthPickerActive,
  isPauseSessionWaitingForInstanceFetch,
} from './application/use-cases/session/gate-flags';
export {
  computePauseSessionHydration,
  computePauseSessionResolved,
  type PauseSessionHydrationInput,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
  type PauseSessionResolvedInput,
} from './application/use-cases/session/hydration';
export { buildPauseSessionScaffoldRitualDerived } from './application/use-cases/session/scaffold-ritual-derived';
export {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './application/use-cases/session/step-bundles';
export type {
  PauseSessionStepRitualBundleInput,
  PauseSessionStepShellBundleInput,
  PauseSessionStepShellChromeInput,
} from './application/use-cases/session/step-bundle-types';
export {
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from './application/use-cases/session/mount-log-params';
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from './application/use-cases/session/persist-snapshot';
export { computePauseGoBackPlan } from './application/use-cases/session/go-back-plan';
export { pauseStepSwipeDirection } from './application/use-cases/session/step-swipe-direction';
export {
  buildPostPauseEmotionLoggedPayload,
  isPostPauseEmotionDirty,
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
} from './application/use-cases/ritual/done/post-pause-emotion-log';
export {
  breathCompletedSegment1Payload,
  breathCompletedSegment2Payload,
} from './application/use-cases/breathing/breath-completed-payload';
export { applyBreathSegmentLogOutcome } from './application/use-cases/breathing/run-breath-segment-log';
export {
  BRIEF_TRIANGLE_CYCLE_COUNT,
  holdProgressWithinPhase,
  parseTriangleRotatingKickersI18n,
  PAUSE_RITUAL_BREATHING_PATTERN_MODE,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
  rotatingKickerIndexFromElapsed,
  RITUAL_TRIANGLE_KICKER_INTERVAL_SEC,
  secondsIntoTrianglePattern,
  TRIANGLE_PHASE_COUNT,
  type PauseRitualBreathingPatternMode,
} from './application/use-cases/breathing/ritual-pattern';
export type { CompanionFeedbackVote } from './application/use-cases/ritual/frame/log-companion-feedback-vote';
export type {
  CompanionSlotCacheIds,
  CompanionSlotRelaxationUi,
  CompanionSlotRelaxations,
} from './application/use-cases/ritual/frame/orchestrate-slot-apply';
export type { PauseSessionShellViewModel } from './application/use-cases/session/shell-view-model';
export { canAdvanceFromPauseStep } from './application/use-cases/session/navigation';
export { computeDeepRitualGoBackTarget } from './application/use-cases/ritual/deep/deep-go-back';
export { ritualDepthUpgradedPayload } from './application/use-cases/ritual/brief/ritual-depth-upgrade-payload';
export {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
  type InitialEmotionLogOpts,
} from './application/use-cases/ritual/feel/initial-emotion-log';
export { initialEmotionResetUi } from './application/use-cases/ritual/feel/run-initial-emotion-log';
export type { InitialEmotionUiState } from './application/use-cases/ritual/feel/run-initial-emotion-log';
export {
  collectStepTypes,
  computePauseState,
  countedCompanionCount,
  decideCronFire,
  pauseInstanceHasBriefRitualTag,
  pauseWindowShowsClockCountdown,
  shouldCountCompanion,
  type CronFireDecision,
  type PauseCompanionAction,
  type PauseCompanionEventRow,
  type PauseCompanionNonCountingReason,
  type PauseExpiredReason,
  type PauseInstanceRow,
  type PauseState,
  type PauseStepEventRow,
  type PauseStepType,
  type PauseTemplateRow,
} from './domain/pause-state';
export type { ArchiveMainSegment } from './domain/archive-segment';
export {
  isArchiveEchoPause,
  itemBelongsToEchoesTab,
  itemBelongsToPausesTab,
  type PauseInstanceArchiveMeta,
  type PauseInstanceArchiveMetaGetter,
} from './domain/archive-segment';
export { getSessionQuote } from './application/use-cases/session/wisdom-quotes';
export { librarySourceLabel } from './domain/library-source-label';
export {
  isMainPauseLibraryBookmark,
  isPauseLibraryNote,
  normalizeLibrarySourceType,
} from './domain/normalize-library-source-type';
export { normalizeLibraryItemUrl } from './domain/library-item-url';
export { writingTextareaClassName } from './domain/writing-surface';
