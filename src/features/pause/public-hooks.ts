/**
 * Pause read-model React hooks — import from here in screens and tests.
 * Pure frame/format helpers used by pause screens also live here (§6 slim `public.ts`).
 */
export { pauseStepLayout } from './presentation/pause-step-layout';
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
  buildPauseSessionMountLogParams,
  type PauseSessionMountLogParams,
} from './application/use-cases/session/mount-log-params';
export {
  buildPauseSessionPersistSnapshot,
  type PauseSessionPersistSnapshotInput,
} from './application/use-cases/session/persist-snapshot';
export { computePauseGoBackPlan } from './application/use-cases/session/go-back-plan';
export {
  BRIEF_INTEGRATE_RING_CIRC,
  BRIEF_INTEGRATE_RING_R,
  BRIEF_INTEGRATE_SECONDS,
  briefIntegrateRemainingProgress,
  briefIntegrateRingDashOffset,
} from './application/use-cases/ritual/brief/brief-integrate-timer';
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
export type { CompanionData, CompanionPrefs } from './domain/companion-card-types';
export type { CachedHistoricalInsightShape } from './domain/historical-insight';
export type {
  InterventionState,
  RegenerateCompanionSlot,
} from './domain/companion-orchestrate';
export type { CompanionFeedbackVote } from './application/use-cases/ritual/frame/log-companion-feedback-vote';
export type {
  CompanionSlotCacheIds,
  CompanionSlotRelaxations,
} from './application/use-cases/ritual/frame/orchestrate-slot-apply';
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
} from './application/use-cases/pending-offer/pending-pause-offer-display';
export { resolveBreathOrbVisualMetrics } from './application/use-cases/ritual/breathe/pause-breath-orb-metrics';
export {
  resolveTriangleKickerDisplay,
  type TriangleKickerDisplay,
} from './application/use-cases/ritual/breathe/resolve-triangle-kicker-display';
export type { FeelStepTile } from './domain/feel-step-tile';
export { PAUSE_FEEL_STEP_TILE_ROWS } from './domain/pause-feel-step-tiles';
export {
  PAUSE_FEEL_INTENSITY_KEYS,
  type PauseFeelIntensityKey,
} from './domain/pause-feel-intensity';
export { estimateReadTime } from './application/use-cases/ritual/frame/estimate-read-time';
export { formatCompanionHistoryRelativeDay } from './application/use-cases/ritual/frame/format-companion-history-relative-day';
export { zoomOutTotalCharsForReadTime } from './application/use-cases/ritual/frame/zoom-out-payload';
export type {
  EchoUserWord,
  ZoomOutData,
  ZoomOutEchoData,
  ZoomOutOnThisDayEntry,
} from './domain/zoom-out-display';
export { resumePauseAudioContext } from './application/use-cases/ritual/breathe/ritual-audio';
export { computeBreathingPhaseAdvance } from './application/use-cases/ritual/breathe/phase-advance';
export {
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
  type PauseRitualBreathingPatternMode,
} from './application/use-cases/ritual/breathe/ritual-pattern';
export {
  STANDALONE_BREATHING_CYCLE_COUNT,
  STANDALONE_BREATHING_PATTERNS,
  resolveStandaloneBreathSeverityRingColors,
  resolveSuggestedStandaloneBreathingPatternIndex,
  type BreathingExerciseSeverity,
  type StandaloneBreathingPattern,
  type StandaloneBreathSeverityRingColors,
  type StandaloneBreathingPhase,
} from './application/use-cases/ritual/breathe/standalone-breathing-patterns';
export type { PauseImpactData } from './application/use-cases/ritual/decide/impact-data';
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
export type { PauseBreathingHandle } from './presentation/session/pause-breathing-handle';
export type {
  PauseSessionBriefRitualBodyProps,
  PauseSessionDeepRitualBodyProps,
} from './presentation/session/ritual-body-props';
export {
  useCompletedPauseCount,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
  fetchCompletedPauseCount,
  getCompletedPauseCountQueryOptions,
} from './presentation/home/use-completed-pause-count';
export { useDismissOutletPauseReady } from './presentation/home/use-dismiss-outlet-pause-ready';
export {
  usePendingPauseOffer,
  pendingPauseOfferQueryKey,
  type PendingPauseOfferRow,
} from './presentation/session/use-pending-pause-offer';
export { usePendingPauseOfferMutations } from './presentation/session/use-pending-pause-offer-mutations';
export {
  usePauseBriefDoneCheckIn,
  type UsePauseBriefDoneCheckInParams,
} from './presentation/session/use-pause-brief-done-check-in';
export { usePauseBriefIntegrateCountdown } from './presentation/session/use-pause-brief-integrate-countdown';
export {
  useBulkHoldPending,
  bulkHoldPendingQueryKey,
  type BulkHoldPendingPause,
  type UseBulkHoldPendingOptions,
} from './presentation/home/use-bulk-hold-pending';
export {
  useBulkHoldApplyOutcomes,
  type UseBulkHoldApplyOutcomesParams,
} from './presentation/home/use-bulk-hold-apply-outcomes';
export {
  usePauseArchiveList,
  type PauseArchiveListSort,
  type PauseArchiveRow,
  type PauseArchiveSegment,
  type UsePauseArchiveListOptions,
} from './presentation/archive/use-pause-archive-list';
export { pauseArchiveRowAllowsRetrospectiveOutcome } from './application/use-cases/archive/retrospective-outcome';
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
export { useSignalSourceTrustedHost } from './presentation/use-signal-source-trusted-host';
export { useStaggeredReveal } from './presentation/companion/use-staggered-reveal';
export {
  fetchSettingsDataExportBundle,
  type SettingsDataExportBundle,
  type SettingsExportAiArtifact,
  type SettingsExportCompanionEvent,
  type SettingsExportPauseRow,
  type SettingsExportStepEvent,
} from './presentation/load-settings-data-export-bundle';
export {
  useCurrentPause,
  currentPauseQueryKey,
  type CurrentPauseRow,
} from './presentation/archive/use-current-pause';
export { useOpenPauseHomePreview } from './presentation/home/use-open-pause-home-preview';
export {
  useManualPauseTrigger,
  type UseManualPauseTriggerParams,
} from './presentation/home/use-manual-pause-trigger';
export {
  useHolzenManualTriggerOrchestration,
  type UseHolzenManualTriggerOrchestrationParams,
} from './presentation/home/use-holzen-manual-trigger-orchestration';
export {
  useHomePauseActions,
  type PauseDismissAnalyticsSurface,
} from './presentation/home/use-home-pause-actions';
export { usePauseContextHomePreviews } from './presentation/home/use-pause-context-home-previews';
export { useHolzenHomeContextState } from './presentation/home/use-holzen-home-context-state';
export {
  millisecondsUntilNextQuarterHour,
  PAUSE_CRON_QUARTER_INTERVAL_MS,
} from './application/use-cases/scheduling/milliseconds-until-next-quarter-hour';
export {
  pauseHomeErrorKind,
  pauseHomeErrorStrings,
  shouldSurfacePauseWidgetError,
  type PauseHomeErrorKind,
} from './application/use-cases/home/pause-home-widget-error';
export { groupBulkHoldByLocalDay } from './application/use-cases/home/bulk-hold/group-by-local-day';
export {
  formatBulkHoldContextQuote,
  formatBulkHoldLocalTime,
  parseBulkHoldChange24hPct,
  type BulkHoldOutcomeChoice,
  type BulkHoldReviewSection,
} from './domain/bulk-hold';
export { usePauseArrivalAudio } from './presentation/home/use-pause-arrival-audio';
export {
  usePauseCardProjection,
  type PauseCardProjection,
  type UsePauseCardProjectionParams,
} from './presentation/home/use-pause-card-projection';
export {
  useZenModeHomeRouteProps,
  type BuildZenModeHomeRoutePropsInput,
  type ZenModeHomeRoutePropsProjection,
} from './presentation/home/use-zen-mode-home-route-props';
export {
  usePauseReflectGeneration,
  type UsePauseReflectGenerationParams,
} from './presentation/reflect/generation/use-pause-reflect-generation';
export {
  usePauseArtifactHaiku,
  type PauseArtifactHaikuFetchPhase,
  type UsePauseArtifactHaikuParams,
  type UsePauseArtifactHaikuResult,
} from './presentation/reflect/generation/use-pause-artifact-haiku';
export { useCompanionSlotOrchestratePorts } from './presentation/companion/use-companion-slot-orchestrate-ports';
export { usePauseReflectionStepLog } from './presentation/reflect/steps/use-pause-reflection-step-log';
export {
  usePauseReflectUiTelemetry,
} from './presentation/reflect/telemetry/use-pause-reflect-ui-telemetry';
export { usePauseReflectTags } from './presentation/reflect/steps/use-pause-reflect-tags';
export { usePauseReflectNote } from './presentation/reflect/steps/use-pause-reflect-note';
export {
  useCompanionHistoryThread,
  type HistoryThreadRow,
} from './presentation/companion/use-companion-history-thread';
export { useRelatedBiasesThisMonth } from './presentation/companion/use-related-biases-this-month';
export { useCompanionFeedbackVote } from './presentation/companion/use-companion-feedback-vote';
export { isCompanionRegenerateUiEnabled } from './presentation/companion/is-companion-regenerate-ui-enabled';
export { useCompanionAccess } from './presentation/companion/use-companion-access';
export { useCompanionUiCompletion } from './presentation/companion/use-companion-ui-completion';
export { useCompanionLibraryFavorites } from './presentation/companion/use-companion-library-favorites';
export { useCompanionSlotUiState } from './presentation/companion/use-companion-slot-ui-state';
export {
  useCompanionOrchestrateSession,
  type UseCompanionOrchestrateSessionParams,
} from './presentation/companion/use-companion-orchestrate-session';
export {
  useCompanionInterventionFetch,
  type UseCompanionInterventionFetchParams,
} from './presentation/companion/use-companion-intervention-fetch';
export {
  useCompanionOrchestrateRetry,
  type UseCompanionOrchestrateRetryParams,
} from './presentation/companion/use-companion-orchestrate-retry';
export {
  useCompanionSlotOrchestrateFailurePorts,
  type UseCompanionSlotOrchestrateFailurePortsParams,
} from './presentation/companion/use-companion-slot-orchestrate-failure-ports';
export {
  useCompanionInterventionBootstrap,
  type UseCompanionInterventionBootstrapParams,
} from './presentation/companion/use-companion-intervention-bootstrap';
export {
  useCompanionSlotRunOrchestrate,
  type UseCompanionSlotRunOrchestrateParams,
} from './presentation/companion/use-companion-slot-run-orchestrate';
export {
  useCompanionSlotOrchestrateActions,
  type UseCompanionSlotOrchestrateActionsParams,
} from './presentation/companion/use-companion-slot-orchestrate-actions';
export {
  useCompanionOrchestration,
  type UseCompanionOrchestrationParams,
} from './presentation/companion/use-companion-orchestration';
export { useCompanionData, type UseCompanionDataParams } from './presentation/companion/use-companion-data';
export {
  useCompanionFullViewPage,
  type UseCompanionFullViewPageParams,
} from './presentation/companion/use-companion-fullview-page';
export {
  useCompanionSection,
  type UseCompanionSectionParams,
} from './presentation/companion/use-companion-section';
export {
  useCompanionSectionExpansion,
  type UseCompanionSectionExpansionParams,
} from './presentation/companion/use-companion-section-expansion';
export {
  useGroundingEnrichment,
  type GroundingEnrichment,
} from './presentation/companion/use-grounding-enrichment';
export { usePauseSessionCompanionSnapshot } from './presentation/companion/use-pause-session-companion-snapshot';
export {
  useFullviewTelemetry,
  type FullviewCompanion,
} from './presentation/companion/use-fullview-telemetry';
export { usePauseFavoriteToggle } from './presentation/reflect/steps/use-pause-favorite-toggle';
export { usePauseReflectFrameFocusAmbience } from './presentation/reflect/ambience/use-pause-reflect-frame-focus-ambience';
export { usePauseFeelShiftLogDedupeRefs } from './presentation/reflect/mood/use-pause-feel-shift-log-dedupe-refs';
export { usePauseBreathSegmentRpcLoggers } from './presentation/session/use-pause-breath-segment-rpc-loggers';
export { usePauseSessionMountLog } from './presentation/session/use-pause-session-mount-log';
export { usePauseSessionGoBack } from './presentation/session/use-pause-session-go-back';
export { usePauseSessionGoToStep } from './presentation/session/use-pause-session-go-to-step';
export { usePauseSessionHeaderBackHandler } from './presentation/session/use-pause-session-header-back-handler';
export { usePauseSessionBreathTimedActiveReset } from './presentation/session/use-pause-session-breath-timed-active-reset';
export {
  usePauseBreathingTimedLoop,
  type PauseBreathingPhase,
  type UsePauseBreathingTimedLoopInput,
} from './presentation/session/use-pause-breathing-timed-loop';
export {
  usePauseSessionBreathUi,
  type UsePauseSessionBreathUiParams,
} from './presentation/session/use-pause-session-breath-ui';
export {
  usePauseSessionBriefToDeep,
  type UsePauseSessionBriefToDeepParams,
} from './presentation/session/use-pause-session-brief-to-deep';
export { usePauseSessionBreathStepHandlers } from './presentation/session/use-pause-session-breath-step-handlers';
export { usePauseShiftFrameDoneHandler } from './presentation/reflect/hub/use-pause-shift-frame-done-handler';
export { usePauseSessionDecideHandler } from './presentation/decide/use-pause-session-decide-handler';
export {
  usePauseSessionReflectAndDecide,
  type UsePauseSessionReflectAndDecideParams,
} from './presentation/reflect/flows/use-pause-session-reflect-and-decide';
export { usePauseSessionDepthPickerHandlers } from './presentation/reflect/mood/use-pause-session-depth-picker-handlers';
export { usePauseSessionFeelTilesSelect } from './presentation/reflect/mood/use-pause-session-feel-tiles-select';
export { usePauseSessionInitialMoodHandlers } from './presentation/reflect/mood/use-pause-session-initial-mood-handlers';
export { usePauseSessionPersistToStorage } from './presentation/session/use-pause-session-persist-to-storage';
export { usePauseSessionRitualStorageSync } from './presentation/session/use-pause-session-ritual-storage-sync';
export {
  usePauseSessionMoodAndPersist,
  type UsePauseSessionMoodAndPersistParams,
} from './presentation/reflect/mood/use-pause-session-mood-and-persist';
export {
  usePauseSessionBreathNavigation,
  type UsePauseSessionBreathNavigationParams,
} from './presentation/session/use-pause-session-breath-navigation';
export {
  usePauseSessionBreathHandlers,
  type UsePauseSessionBreathHandlersParams,
} from './presentation/session/use-pause-session-breath-handlers';
export { usePauseSessionExitNavigation } from './presentation/session/use-pause-session-exit-navigation';
export { usePauseSessionPendingPauseOfferNavigation } from './presentation/session/use-pause-session-pending-pause-offer-navigation';
export { usePauseSessionPendingLeaveSheet } from './presentation/session/use-pause-session-pending-leave-sheet';
export { usePauseSessionMoodChromeHandlers } from './presentation/reflect/mood/use-pause-session-mood-chrome-handlers';
export { usePauseSessionBreathReflectHandlers } from './presentation/reflect/flows/use-pause-session-breath-reflect-handlers';
export { usePauseSessionEntryPresentationEffects } from './presentation/session/use-pause-session-entry-presentation-effects';
export { usePauseSessionTerminalEntryRedirect } from './presentation/session/use-pause-session-terminal-entry-redirect';
export { usePauseSessionStepTransition } from './presentation/session/use-pause-session-step-transition';
export { usePauseSessionDepthAndBriefCopy } from './presentation/reflect/mood/use-pause-session-depth-and-brief-copy';
export {
  usePauseSessionScaffoldRitual,
  type UsePauseSessionScaffoldRitualParams,
  type PauseSessionScaffoldRitualDerivedParams,
} from './presentation/session/use-pause-session-scaffold-ritual';
export { usePauseSessionBreathSecondLabelVariant } from './presentation/session/use-pause-session-breath-second-label-variant';
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
} from './presentation/session/use-pause-session-scaffold-presentation';
export {
  usePauseSessionScaffoldVm,
  type PauseSessionScaffoldVmResult,
} from './presentation/session/use-pause-session-scaffold-vm';
export type {
  PauseScaffoldChromeRegistry,
  PauseSessionScaffoldVmChromeSlots,
  PauseSessionScaffoldVmProvidersSlice,
} from './presentation/session/pause-session-scaffold-vm-types';
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
