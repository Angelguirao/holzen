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
export { pauseArchiveRowAllowsRetrospectiveOutcome } from './application/use-cases/archive/retrospective-outcome';
export { pauseArchiveListQueryPrefix } from './application/queries/archive-query-keys';
export type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
  LibraryListSortMode,
} from './domain/library-bundle';
export { buildOutcomeLoggedPayload } from './application/use-cases/outcome-log-payload';
export { runPauseOutcomeLog } from './application/use-cases/session/run-pause-outcome-log';
export { shouldLogPauseReflectionStep } from './application/use-cases/reflect/run-pause-reflection-step-log';
export { shouldShowFavoriteProHint } from './application/use-cases/reflect/run-pause-favorite-toggle';
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
export { invalidatePauseStatsDataForUser } from './application/queries/invalidate-pause-stats';
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
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  type FetchedPauseInstance,
  type PersistedSession,
} from './domain/session-model';
export { companionDataFromArtifacts } from './application/use-cases/companion/companion-data-from-artifacts';
export { migratePersistedPauseSession } from './application/use-cases/session/migrate-persisted-session';
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
} from './application/use-cases/companion/intervention-idempotency';
export {
  applyCompanionOrchestrateRetryReset,
  type CompanionOrchestrateRetryResetInput,
  type CompanionOrchestrateRetryResetPorts,
} from './application/use-cases/companion/apply-companion-orchestrate-retry-reset';
export {
  reflectGenerationPrerequisite,
  type ReflectGenerationPrerequisite,
} from './application/use-cases/reflect/generation-prerequisites';
export {
  isAbortLikeReflectError,
  reflectGenerationUserErrorMessage,
} from './application/use-cases/reflect/reflect-generation-errors';
export {
  buildReflectGenerationEdgeInvokeInput,
  type ReflectGenerationEdgeInvokeInput,
  type ReflectGenerationProfileInput,
} from './application/use-cases/reflect/reflect-generation-edge-params';
export {
  runReflectGeneration,
  type RunReflectGenerationInput,
  type RunReflectGenerationPorts,
  type RunReflectGenerationResult,
} from './application/use-cases/reflect/run-reflect-generation';
export {
  BOX_BREATH_PHASE_COUNT,
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  type BreathingPhaseAdvanceResult,
} from './application/use-cases/breathing/phase-advance';
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
export { showPauseFavoriteProHintToast } from './application/use-cases/feedback/favorite-toast';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './application/use-cases/feedback/outcome-toast';
export { showPauseStepSyncFailedToast } from './application/use-cases/feedback/step-sync-toast';
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
export type { FeelStepTile } from './domain/feel-step-tile';
export type { MoodValue } from './domain/mood-value';
export { PAUSE_MOOD_VALUES, PAUSE_MOOD_GROUPS } from './domain/mood-value';
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
export type {
  EchoUserWord,
  ZoomOutData,
  ZoomOutEchoData,
  ZoomOutOnThisDayEntry,
} from './domain/zoom-out-display';
export {
  ZOOM_OUT_DEFAULT_BODY_PLACEHOLDER,
  ZOOM_OUT_DEFAULT_LABEL,
  toZoomOutDisplayData,
  zoomOutBodyPreviewFromJsonString,
  zoomOutLibraryAutosaveFromDisplayData,
  zoomOutSaveThisMomentSeed,
  zoomOutTotalCharsForReadTime,
} from './application/use-cases/companion/zoom-out-payload';
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
export { isPauseReflectGenerationEnabled } from './application/use-cases/session/reflect-generation-enabled';
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from './application/use-cases/session/step-transition';
export {
  isPauseMoodValue,
  buildPostPauseEmotionLoggedPayload,
  isPostPauseEmotionDirty,
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
} from './application/use-cases/session/post-pause-emotion-log';
export { buildPauseScoreImpacts } from './application/use-cases/score-impacts';
export {
  breathCompletedSegment1Payload,
  breathCompletedSegment2Payload,
} from './application/use-cases/breathing/breath-completed-payload';
export {
  applyBreathSegmentLogOutcome,
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
} from './application/use-cases/breathing/run-breath-segment-log';
export {
  BRIEF_TRIANGLE_CYCLE_COUNT,
  holdProgressWithinPhase,
  PAUSE_RITUAL_BREATHING_PATTERN_MODE,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
  rotatingKickerIndexFromElapsed,
  RITUAL_TRIANGLE_KICKER_INTERVAL_SEC,
  secondsIntoTrianglePattern,
  TRIANGLE_PHASE_COUNT,
  type PauseRitualBreathingPatternMode,
} from './application/use-cases/breathing/ritual-pattern';
export {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './application/use-cases/breathing/ritual-audio';
export { getRecencyHints } from './application/use-cases/companion/recency-hints';
export {
  companionSlotToGenerationTaxonomy,
  trackCompanionGenerationInitiated,
  trackCompanionServed,
} from './application/use-cases/companion/analytics';
export {
  applyCompanionSlotOrchestrateOutcome,
  type ApplyCompanionSlotOrchestrateOutcomeInput,
} from './application/use-cases/companion/apply-companion-slot-orchestrate-outcome';
export {
  logCompanionSlotOrchestrateEmpty,
  logCompanionSlotOrchestrateFailed,
  logCompanionSlotOrchestrateFilled,
  logCompanionSlotOrchestrateInvoke,
} from './application/use-cases/companion/companion-slot-orchestrate-telemetry';
export { runCompanionInterventionBootstrap } from './application/use-cases/companion/run-companion-intervention-bootstrap';
export {
  buildCompanionFeedbackVoteMetadata,
  type CompanionFeedbackVote,
  type LogCompanionFeedbackVoteInput,
} from './application/use-cases/companion/log-companion-feedback-vote';
export {
  isCompanionOrchestratePaywallCode,
  isOrchestratePayloadError,
  resolveCompanionOrchestrateInvokeFailure,
  resolveOrchestrateInvokeUserMessage,
  type CompanionOrchestrateInvokeFailure,
  type CompanionOrchestrateInvokeFailureKind,
  type CompanionOrchestratePaywallCode,
} from './application/use-cases/companion/orchestrate-invoke-error';
export {
  buildCompanionOrchestrateSessionFromRitual,
  buildInterventionOrchestrateBody,
  buildLazyFetchOrchestrateBody,
  buildRegenerateOrchestrateBody,
  type CompanionOrchestrateSessionContext,
} from './application/use-cases/companion/build-companion-orchestrate-body';
export {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from './application/use-cases/companion/load-companion-orchestrate-session';
export {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
  type RunCompanionSlotOrchestratePorts,
  type RunCompanionSlotOrchestrateResult,
} from './application/use-cases/companion/run-companion-slot-orchestrate';
export {
  applyCompanionSlotOrchestrateFailureUi,
  resolveCompanionSlotOrchestrateFailureUi,
  type ApplyCompanionSlotOrchestrateFailureUiPorts,
  type CompanionSlotOrchestrateFailureUi,
} from './application/use-cases/companion/companion-slot-orchestrate-failure-ui';
export {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from './application/use-cases/companion/companion-slot-ui-state';
export {
  companionUiCompletionQueryKey,
  invalidateCompanionUiCompletionQuery,
} from './application/queries/companion-ui-completion-query-key';
export {
  applyOrchestrateSlotLazyOrRegenerate,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  hydrateOrchestrateSlotIfNew,
  hydrateOrchestrateSlotsFromInterventionResponse,
  INTERVENTION_RESPONSE_COMPANION_SLOTS,
  isFilledOrchestrateSlot,
  readOrchestrateSlotBody,
  tryApplyOrchestrateSlotFromBody,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxationUi,
  type CompanionSlotRelaxations,
} from './application/use-cases/companion/orchestrate-slot-apply';
export {
  hydrateCompanionSlotsFromArtifactCache,
  type HydrateCompanionSlotsFromArtifactCacheResult,
} from './application/use-cases/companion/hydrate-companion-slots-from-artifact-cache';
export {
  buildPauseSessionScaffoldRitualPayloads,
  type PauseSessionScaffoldRitualPayloadsParams,
} from './presentation/session/scaffold-ritual-payloads';
export type { PauseSessionShellViewModel } from './application/use-cases/session/shell-view-model';
export { canAdvanceFromPauseStep } from './application/use-cases/session/navigation';
export { computeDeepRitualGoBackTarget } from './application/use-cases/ritual/deep/deep-go-back';
export { hostnameFromUrl } from './application/use-cases/companion/url';
export {
  dedupeBiases,
  normalizeBiasTitle,
  type RelatedBias,
  type RelatedBiasesRow,
} from './application/use-cases/companion/related-biases';
export { deriveBreathingUiCompleteFromPayloads } from './application/use-cases/companion/breathing-ui-complete';
export { ritualDepthUpgradedPayload } from './application/use-cases/ritual-depth-upgrade-payload';
export {
  PAUSE_QUERY_PREFIX,
} from './application/queries/pause-query-namespace';
export {
  PAUSE_INSTANCE_QUERY_ROOT,
  pauseInstanceQueryPrefix,
} from './application/queries/pause-instance-query-prefix';
export {
  buildShiftEmotionFrameHubLogBundle,
  runShiftEmotionFrameHubDone,
} from './application/use-cases/session/shift-emotion-log';
export {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
  type InitialEmotionLogOpts,
} from './application/use-cases/session/initial-emotion-log';
export {
  initialEmotionResetUi,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
  type InitialEmotionUiState,
} from './application/use-cases/session/run-initial-emotion-log';
export {
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
  PAUSE_OPEN_MAX_AGE_MS,
} from './application/use-cases/session/open-max-countdown';
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
export type { PauseBreathingHandle } from './presentation/session/pause-breathing-handle';
export type {
  PauseSessionBriefRitualBodyProps,
  PauseSessionDeepRitualBodyProps,
} from './presentation/session/ritual-body-props';
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
