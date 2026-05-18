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
export {
  isPausePersistError,
  isReflectionPersistError,
  reflectionPersistErrorMessage,
  PAUSE_PERSIST_ERROR_MARKER,
  REFLECTION_PERSIST_ERROR_MARKER,
} from './application/use-cases/reflection-persist-error';
export { pauseArchiveRowAllowsRetrospectiveOutcome } from './application/archive/retrospective-outcome';
export { pauseArchiveListQueryPrefix } from './application/queries/archive-query-keys';
export type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
  LibraryListSortMode,
} from './domain/library-bundle';
export { buildOutcomeLoggedPayload } from './application/use-cases/outcome-log-payload';
export { groupBulkHoldByLocalDay } from './application/bulk-hold/group-by-local-day';
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
export { invalidatePauseStatsDataForUser } from './application/queries/invalidate-pause-stats';
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from './application/breathing/breath-second-label-variant';
export {
  BRIEF_PAUSE_ORDER,
  computeBriefMacroProgressPosition,
} from './application/brief-ritual/brief-pause-order';
export {
  computeBriefRitualGoBack,
  type BriefRitualGoBackResult,
} from './application/brief-ritual/brief-pause-go-back';
export {
  computeBriefPastStepClick,
  type BriefPastStepClickResult,
} from './application/brief-ritual/brief-pause-past-step-click';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './application/session/persisted-session-guards';
export {
  TERMINAL_PAUSE_DB_STATES,
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
} from './application/session/terminal-entry-guard';
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
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  type FetchedPauseInstance,
  type PersistedSession,
} from './domain/session-model';
export { companionDataFromArtifacts } from './application/companion/companion-data-from-artifacts';
export { migratePersistedPauseSession } from './application/session/migrate-persisted-session';
export {
  clearSession,
  loadSession,
  saveSession,
} from './infrastructure/session/persisted-session-storage';
export {
  getInterventionIdempotencyDecision,
  hasInvokedIntervention,
  resetInterventionIdempotency,
  runOnceIntervention,
  type InterventionIdempotencyDecision,
} from './application/companion/intervention-idempotency';
export {
  reflectGenerationPrerequisite,
  type ReflectGenerationPrerequisite,
} from './application/reflect/generation-prerequisites';
export {
  BOX_BREATH_PHASE_COUNT,
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  type BreathingPhaseAdvanceResult,
} from './application/breathing/phase-advance';
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
export { showPauseFavoriteProHintToast } from './application/feedback/favorite-toast';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './application/feedback/outcome-toast';
export { showPauseStepSyncFailedToast } from './application/feedback/step-sync-toast';
export {
  buildFetchedPauseInstanceFromFetch,
  type PauseAiArtifactKindRow,
  type PauseInstanceContextSnapshotRow,
} from './application/session/fetched-instance-from-fetch';
export {
  computePauseStorageRitualSyncPatch,
  type PauseStorageRitualSyncPatch,
} from './application/session/storage-ritual-sync';
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
  ZOOM_OUT_DEFAULT_BODY_PLACEHOLDER,
  ZOOM_OUT_DEFAULT_LABEL,
  toZoomOutDisplayData,
  zoomOutLibraryAutosaveFromDisplayData,
  zoomOutTotalCharsForReadTime,
} from './application/companion/zoom-out-payload';
export {
  type NotificationNavigateState,
  type PauseSessionLocationState,
  type PauseSessionNavParsed,
  type PauseSeverity,
  parsePauseSessionLocationState,
} from './application/session/location-state';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
} from './application/session/header-back';
export { briefSwitchToDeepPauseState } from './application/session/brief-switch-to-deep';
export {
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
} from './application/session/step-map';
export { coalescePauseSessionShellViewModel } from './application/session/shell-view-model';
export {
  isPauseSessionDepthPickerActive,
  isPauseSessionWaitingForInstanceFetch,
} from './application/session/gate-flags';
export {
  computePauseSessionHydration,
  computePauseSessionResolved,
  type PauseSessionHydrationInput,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
  type PauseSessionResolvedInput,
} from './application/session/hydration';
export { buildPauseSessionScaffoldRitualDerived } from './application/session/scaffold-ritual-derived';
export {
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from './application/session/mount-log-params';
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from './application/session/persist-snapshot';
export { computePauseGoBackPlan } from './application/session/go-back-plan';
export { pauseStepSwipeDirection } from './application/session/step-swipe-direction';
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from './application/session/step-transition';
export {
  isPauseMoodValue,
  buildPostPauseEmotionLoggedPayload,
} from './application/session/post-pause-emotion-log';
export { buildPauseScoreImpacts } from './application/use-cases/score-impacts';
export {
  breathCompletedSegment1Payload,
  breathCompletedSegment2Payload,
} from './application/breathing/breath-completed-payload';
export {
  holdProgressWithinPhase,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
  rotatingKickerIndexFromElapsed,
  secondsIntoTrianglePattern,
} from './application/breathing/ritual-pattern';
export {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './application/breathing/ritual-audio';
export { getRecencyHints } from './application/companion/recency-hints';
export { trackCompanionServed } from './application/companion/analytics';
export {
  companionUiCompletionQueryKey,
  invalidateCompanionUiCompletionQuery,
} from './application/queries/companion-ui-completion-query-key';
export {
  applyOrchestrateSlotLazyOrRegenerate,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  hydrateOrchestrateSlotIfNew,
  isFilledOrchestrateSlot,
  readOrchestrateSlotBody,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxationUi,
  type CompanionSlotRelaxations,
} from './application/companion/orchestrate-slot-apply';
export { buildPauseSessionScaffoldRitualPayloads } from './presentation/session/scaffold-ritual-payloads';
export { buildShiftEmotionFrameHubLogBundle } from './application/session/shift-emotion-log';
export {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
  type InitialEmotionLogOpts,
} from './application/session/initial-emotion-log';
export {
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
  PAUSE_OPEN_MAX_AGE_MS,
} from './application/session/open-max-countdown';
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
