/**
 * Pause read-model React hooks — import from here in screens and tests.
 * Ritual layout tokens: `public-session` (`pauseStepLayout`). Pure helpers: §6 slim `public.ts`.
 */
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from './application/use-cases/session/step-transition';
export { computePauseGoBackPlan } from './public-ritual-brief';
export {
  BRIEF_INTEGRATE_RING_CIRC,
  BRIEF_INTEGRATE_RING_R,
  BRIEF_INTEGRATE_SECONDS,
  briefIntegrateRemainingProgress,
  briefIntegrateRingDashOffset,
} from './public-ritual-brief';
export {
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
  PAUSE_OPEN_MAX_AGE_MS,
} from './application/use-cases/session/open-max-countdown';
export { pauseWindowShowsClockCountdown } from './domain/pause-state';
export type { ArchiveMainSegment } from './domain/archive-segment';
export {
  PAUSE_MOOD_GROUPS,
  PAUSE_MOOD_VALUES,
  isPauseMoodValue,
} from './domain/mood-value';
export type { MoodValue } from './domain/mood-value';
export {
  resolveDoneWallpaperMood,
  type DoneWallpaperMoodInput,
} from './application/use-cases/ritual/done/resolve-done-wallpaper-mood';
export type { BriefPauseStep, RitualDepth } from './domain/ritual-types';
export {
  BRIEF_PAUSE_ORDER,
  computeBriefMacroProgressPosition,
} from './domain/brief-ritual-steps';
export {
  PAUSE_DEEP_RITUAL_STEPS,
  PAUSE_DEEP_DISPLAY_STEP_COUNT,
  STEPS,
  pauseDeepDisplayProgressIndex,
  pauseDeepMacroStepNumber,
  type PauseStep,
} from './domain/pause-ritual-steps';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  useCompletedPauseCount,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
  fetchCompletedPauseCount,
  getCompletedPauseCountQueryOptions,
  useDismissOutletPauseReady,
  usePendingPauseOffer,
  pendingPauseOfferQueryKey,
  type PendingPauseOfferRow,
} from './public-home';
export {
  BREATH_ORB_CX,
  BREATH_ORB_CY,
  BREATH_ORB_HEX_PATH_LEN,
  BREATH_ORB_INNER_LEN,
  BREATH_ORB_INNER_RING_R,
  BREATH_ORB_PX,
  BREATH_RING_C,
  BREATH_RING_R,
  resolveHoldMandalaLayerWeights,
  type HoldMandalaLayerWeights,
} from './application/use-cases/ritual/breathe/breath-orb-geometry';
export type { PauseBreathingPhase } from './public-ritual-breathe';
export {
  resolveTriangleKickerDisplay,
  resolvePauseBreathingTimedDisplay,
  BRIEF_TRIANGLE_CYCLE_COUNT,
  BOX_BREATH_PHASE_COUNT,
  holdProgressWithinPhase,
  parseTriangleRotatingKickersI18n,
  PAUSE_RITUAL_BREATHING_PATTERN_MODE,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
  rotatingKickerIndexFromElapsed,
  RITUAL_TRIANGLE_KICKER_INTERVAL_SEC,
  secondsIntoTrianglePattern,
  TRIANGLE_PHASE_COUNT,
  STANDALONE_BREATHING_CYCLE_COUNT,
  STANDALONE_BREATHING_PATTERNS,
  resolveStandaloneBreathSeverityRingColors,
  resolveSuggestedStandaloneBreathingPatternIndex,
  type PauseRitualBreathingPatternMode,
  type PauseBreathingTimedDisplay,
  type TriangleKickerDisplay,
  type BreathingExerciseSeverity,
  type StandaloneBreathingPattern,
  type StandaloneBreathSeverityRingColors,
  type StandaloneBreathingPhase,
  usePauseBreathingTimedLoop,
  type UsePauseBreathingTimedLoopInput,
  resolveBreathOrbVisualMetrics,
  applyBreathSegmentLogOutcome,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
} from './public-ritual-breathe';
export {
  PAUSE_SCIENCE_STEPS,
  type PauseScienceSource,
  type PauseScienceStepConfig,
  type PauseScienceStepKey,
} from './domain/pause-science/pause-science-steps';
export { stepHighlightsScienceRow } from './domain/pause-science/pause-science-step-highlight';
export { briefStepToPauseScienceStep } from './domain/pause-science/brief-step-to-pause-science-step';
export type { FeelStepTile } from './domain/feel-step-tile';
export { PAUSE_FEEL_STEP_TILE_ROWS } from './domain/pause-feel-step-tiles';
export {
  PAUSE_FEEL_INTENSITY_KEYS,
  type PauseFeelIntensityKey,
} from './domain/pause-feel-intensity';
export {
  computeBreathingPhaseAdvance,
  resumePauseAudioContext,
} from './public-ritual-breathe';
export type { PauseImpactData } from './domain/decide/pause-impact-data';
export {
  buildPauseScoreImpacts,
  type PauseScoreImpactRow,
} from './application/use-cases/ritual/decide/score-impacts';
export {
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from './application/use-cases/ritual/decide/score-impact-presentation';
export type { PauseBreathingHandle } from './presentation/session/breath/pause-breathing-handle';
export type {
  PauseSessionBriefRitualBodyProps,
  PauseSessionDeepRitualBodyProps,
} from './presentation/session/ritual-body-props';
export { usePendingPauseOfferMutations } from './public-session';
export {
  usePauseBriefDoneCheckIn,
  type UsePauseBriefDoneCheckInParams,
} from './presentation/ritual/done/use-pause-brief-done-check-in';
export { usePauseBriefIntegrateCountdown } from './presentation/session/use-pause-brief-integrate-countdown';
export { usePauseBreathSegmentRpcLoggers } from './presentation/session/breath/use-pause-breath-segment-rpc-loggers';
export {
  useBulkHoldPending,
  bulkHoldPendingQueryKey,
  type BulkHoldPendingPause,
  type UseBulkHoldPendingOptions,
  useBulkHoldApplyOutcomes,
  type UseBulkHoldApplyOutcomesParams,
} from './public-home';
export {
  usePauseArchiveList,
  type PauseArchiveListSort,
  type PauseArchiveRow,
  type PauseArchiveSegment,
  type UsePauseArchiveListOptions,
} from './presentation/archive/use-pause-archive-list';
export { pauseArchiveRowAllowsRetrospectiveOutcome } from './public-queries';
export { getArchivePausesTabHasRowsQueryOptions } from './public-queries';
export {
  useArchivePauseRetrospectiveOutcome,
  type UseArchivePauseRetrospectiveOutcomeParams,
} from './presentation/archive/use-archive-pause-retrospective-outcome';
export {
  useJourneyPauseInstances,
  type JourneyPauseRow,
} from './presentation/archive/use-journey-pause-instances';
export { logPwaInstallAnalyticsEvent } from './public-queries';
export {
  fetchSettingsDataExportBundle,
  type SettingsDataExportBundle,
  type SettingsExportAiArtifact,
  type SettingsExportCompanionEvent,
  type SettingsExportPauseRow,
  type SettingsExportStepEvent,
} from './presentation/settings/load-settings-data-export-bundle';
export {
  useCurrentPause,
  currentPauseQueryKey,
  type CurrentPauseRow,
} from './presentation/archive/use-current-pause';
export {
  useOpenPauseHomePreview,
  useManualPauseTrigger,
  type UseManualPauseTriggerParams,
  useHolzenManualTriggerOrchestration,
  type UseHolzenManualTriggerOrchestrationParams,
  useHomePauseActions,
  type PauseDismissAnalyticsSurface,
  usePauseContextHomePreviews,
  useHolzenHomeContextState,
} from './public-home';
export {
  millisecondsUntilNextQuarterHour,
  PAUSE_CRON_QUARTER_INTERVAL_MS,
} from './public-scheduling';
export {
  buildHomePauseCardBodyProps,
  pauseHomeErrorKind,
  pauseHomeErrorStrings,
  shouldShowHomePauseSectionSnooze,
  shouldSurfacePauseWidgetError,
  type BuildHomePauseCardBodyPropsInput,
  type HomePauseCardBodyPropsProjection,
  type PauseContextHomePreview,
  type PauseHomeErrorKind,
} from './public-home';
export {
  groupBulkHoldByLocalDay,
  formatBulkHoldContextQuote,
  formatBulkHoldLocalTime,
  parseBulkHoldChange24hPct,
  type BulkHoldOutcomeChoice,
  type BulkHoldReviewSection,
} from './public-home';
export {
  usePauseArrivalAudio,
  usePauseCardProjection,
  useZenModeHomeRouteProps,
  type PauseCardProjection,
  type UsePauseCardProjectionParams,
} from './public-home';
export {
  buildReflectionShareText,
  resolveEffectiveReflectionCopy,
  resolveFrameHaikuDisplayBody,
  resolvePauseReflectMessageView,
  type PauseReflectMessageView,
  usePauseArtifactHaiku,
  type PauseArtifactHaikuFetchPhase,
  type UsePauseArtifactHaikuParams,
  type UsePauseArtifactHaikuResult,
  usePauseArtifactReflectionText,
  type PauseArtifactReflectionTextFetchPhase,
  type UsePauseArtifactReflectionTextParams,
  type UsePauseArtifactReflectionTextResult,
  usePauseReflectGeneration,
  type UsePauseReflectGenerationParams,
  usePauseReflectFrameFocusAmbience,
  usePauseReflectNote,
  usePauseReflectionStepLog,
  usePauseReflectTags,
  usePauseReflectUiTelemetry,
  usePauseSessionReflectAndDecide,
  type UsePauseSessionReflectAndDecideParams,
  usePauseSessionDecideHandler,
  usePauseShiftFrameDoneHandler,
  useReflectionShareHandlers,
  type UseReflectionShareHandlersParams,
  usePauseFavoriteToggle,
  usePauseSessionMoodChromeHandlers,
  usePauseSessionMoodAndPersist,
  type UsePauseSessionMoodAndPersistParams,
  usePauseSessionDepthPickerHandlers,
  usePauseSessionFeelTilesSelect,
  usePauseSessionInitialMoodHandlers,
  PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS,
  usePauseFeelShiftLogDedupeRefs,
  usePauseSessionDepthAndBriefCopy,
  usePauseSessionPersistToStorage,
  usePauseSessionRitualStorageSync,
} from './public-ritual-reflect';
export {
  usePauseSessionBreathStepHandlers,
  usePauseSessionBreathHandlers,
  type UsePauseSessionBreathHandlersParams,
  usePauseSessionBreathReflectHandlers,
} from './public-ritual-breathe';
export type {
  CachedHistoricalInsightShape,
  CompanionData,
  CompanionFeedbackVote,
  CompanionPrefs,
  CompanionRegenerateClickResult,
  CompanionSectionProFavoriteProps,
  CompanionSlotCacheIds,
  CompanionSlotRelaxations,
  EchoUserWord,
  FullviewCompanion,
  GroundingEnrichment,
  HistoryThreadRow,
  InterventionState,
  RegenerateCompanionSlot,
  UseCompanionDataParams,
  UseCompanionFullViewPageParams,
  UseCompanionInterventionBootstrapParams,
  UseCompanionInterventionFetchParams,
  UseCompanionOrchestrateRetryParams,
  UseCompanionOrchestrateSessionParams,
  UseCompanionOrchestrationParams,
  UseCompanionSectionExpansionParams,
  UseCompanionSectionParams,
  UseCompanionSlotOrchestrateActionsParams,
  UseCompanionSlotOrchestrateFailurePortsParams,
  UseCompanionSlotRunOrchestrateParams,
  ZoomOutData,
  ZoomOutEchoData,
  ZoomOutOnThisDayEntry,
} from './public-ritual-frame';
export {
  companionSectionProFavoriteProps,
  estimateReadTime,
  formatCompanionHistoryRelativeDay,
  isCompanionRegenerateUiEnabled,
  resolveCompanionRegenerateClick,
  useCompanionAccess,
  useCompanionData,
  useCompanionFeedbackVote,
  useCompanionFullViewPage,
  useCompanionHistoryThread,
  useCompanionInterventionBootstrap,
  useCompanionInterventionFetch,
  useCompanionLibraryFavorites,
  useCompanionOrchestrateRetry,
  useCompanionOrchestrateSession,
  useCompanionOrchestration,
  useCompanionSection,
  useCompanionSectionExpansion,
  useCompanionSlotOrchestrateActions,
  useCompanionSlotOrchestrateFailurePorts,
  useCompanionSlotRunOrchestrate,
  useCompanionSlotUiState,
  useCompanionUiCompletion,
  useFullviewTelemetry,
  useGroundingEnrichment,
  usePauseSessionCompanionSnapshot,
  useRelatedBiasesThisMonth,
  useSignalSourceTrustedHost,
  useStaggeredReveal,
  zoomOutTotalCharsForReadTime,
} from './public-ritual-frame';
export { usePauseSessionMountLog } from './presentation/session/use-pause-session-mount-log';
export { usePauseSessionGoBack } from './presentation/session/use-pause-session-go-back';
export { usePauseSessionGoToStep } from './presentation/session/use-pause-session-go-to-step';
export { usePauseSessionHeaderBackHandler } from './presentation/session/use-pause-session-header-back-handler';
export { usePauseSessionBreathTimedActiveReset } from './presentation/session/breath/use-pause-session-breath-timed-active-reset';
export {
  usePauseSessionBreathUi,
  type UsePauseSessionBreathUiParams,
} from './presentation/session/breath/use-pause-session-breath-ui';
export {
  usePauseSessionBriefToDeep,
  type UsePauseSessionBriefToDeepParams,
} from './presentation/session/use-pause-session-brief-to-deep';
export {
  usePauseSessionBreathNavigation,
  type UsePauseSessionBreathNavigationParams,
} from './presentation/session/breath/use-pause-session-breath-navigation';
export { usePauseSessionExitNavigation } from './presentation/session/use-pause-session-exit-navigation';
export { usePauseSessionPendingPauseOfferNavigation } from './presentation/session/use-pause-session-pending-pause-offer-navigation';
export { usePauseSessionPendingLeaveSheet } from './presentation/session/use-pause-session-pending-leave-sheet';
export { usePauseSessionEntryPresentationEffects } from './presentation/session/use-pause-session-entry-presentation-effects';
export { usePauseSessionTerminalEntryRedirect } from './presentation/session/use-pause-session-terminal-entry-redirect';
export { usePauseSessionStepTransition } from './presentation/session/use-pause-session-step-transition';
export {
  usePauseSessionScaffoldRitual,
  type UsePauseSessionScaffoldRitualParams,
  type PauseSessionScaffoldRitualDerivedParams,
} from './presentation/session/scaffold/use-pause-session-scaffold-ritual';
export { usePauseSessionBreathSecondLabelVariant } from './presentation/session/breath/use-pause-session-breath-second-label-variant';
export { usePauseSessionFetch } from './presentation/session/use-pause-session-fetch';
export {
  usePauseSessionBriefPastStep,
  type UsePauseSessionBriefPastStepParams,
} from './presentation/session/use-pause-session-brief-past-step';
export {
  usePauseSessionShell,
  type UsePauseSessionShellParams,
} from './presentation/session/use-pause-session-shell';
export {
  usePauseSessionShellBootstrap,
  type UsePauseSessionShellBootstrapParams,
} from './presentation/session/use-pause-session-shell-bootstrap';
export { usePauseSessionRitualState } from './presentation/session/use-pause-session-ritual-state';
export {
  usePauseSessionShellRitual,
  type PauseSessionShellRitualProvidersSlice,
  type PauseSessionShellRitualResult,
} from './presentation/session/use-pause-session-shell-ritual';
export {
  usePauseSessionStepHandlers,
  type PauseSessionStepHandlersResult,
} from './presentation/session/use-pause-session-step-handlers';
export type { PauseSessionStepHandlersProvidersSlice } from './presentation/session/pause-session-step-handler-types';
export {
  usePauseSessionScaffoldPresentation,
  type UsePauseSessionScaffoldPresentationParams,
} from './presentation/session/scaffold/use-pause-session-scaffold-presentation';
export {
  usePauseSessionScaffoldVm,
  type PauseSessionScaffoldVmResult,
} from './presentation/session/scaffold/use-pause-session-scaffold-vm';
export type {
  PauseScaffoldChromeRegistry,
  PauseSessionScaffoldVmChromeSlots,
  PauseSessionScaffoldVmProvidersSlice,
} from './presentation/session/scaffold/pause-session-scaffold-vm-types';
export {
  usePauseSessionFlowCore,
  type PauseSessionFlowCoreProvidersSlice,
  type PauseSessionFlowCoreResult,
} from './presentation/session/use-pause-session-flow-core';
export {
  usePauseSessionRitualSurface,
  type PauseSessionRitualSurfaceMotionSlice,
  type PauseSessionRitualSurfaceResult,
} from './presentation/session/use-pause-session-ritual-surface';
export { usePauseSessionProviders } from './presentation/session/use-pause-session-providers-conductor';
export { usePauseSessionProvidersFromHolzenSlice } from './presentation/session/use-pause-session-providers';
export type {
  PauseSessionFlowConductorProvidersSlice,
  PauseSessionHolzenProvidersSlice,
  PauseSessionProviders,
  PauseSessionSubscriptionGateSlice,
} from './presentation/session/pause-session-providers-types';
export {
  usePauseSessionFlow,
  usePauseSessionFlowThroughSteps,
  usePauseSessionFlowWithChrome,
} from './presentation/session/use-pause-session-flow';
export {
  usePauseSessionScreen,
  usePauseSessionScreenViewModel,
  type PauseSessionScreenViewModel,
} from './presentation/session/use-pause-session-screen';
