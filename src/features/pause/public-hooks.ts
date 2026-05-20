/**
 * Pause read-model React hooks — import from here in screens and tests.
 */
export {
  useCompletedPauseCount,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
  fetchCompletedPauseCount,
  getCompletedPauseCountQueryOptions,
} from './presentation/use-completed-pause-count';
export {
  usePendingPauseOffer,
  pendingPauseOfferQueryKey,
  type PendingPauseOfferRow,
} from './presentation/use-pending-pause-offer';
export {
  useCurrentPause,
  currentPauseQueryKey,
  type CurrentPauseRow,
} from './presentation/use-current-pause';
export { useOpenPauseHomePreview } from './presentation/use-open-pause-home-preview';
export {
  useManualPauseTrigger,
  type UseManualPauseTriggerParams,
} from './presentation/use-manual-pause-trigger';
export {
  useHolzenManualTriggerOrchestration,
  type UseHolzenManualTriggerOrchestrationParams,
} from './presentation/use-holzen-manual-trigger-orchestration';
export {
  useHomePauseActions,
  type PauseDismissAnalyticsSurface,
} from './presentation/use-home-pause-actions';
export { usePauseContextHomePreviews } from './presentation/use-pause-context-home-previews';
export { useHolzenHomeContextState } from './presentation/use-holzen-home-context-state';
export { usePauseArrivalAudio } from './presentation/use-pause-arrival-audio';
export {
  usePauseCardProjection,
  type PauseCardProjection,
  type UsePauseCardProjectionParams,
} from './presentation/use-pause-card-projection';
export {
  useZenModeHomeRouteProps,
  type BuildZenModeHomeRoutePropsInput,
  type ZenModeHomeRoutePropsProjection,
} from './presentation/use-zen-mode-home-route-props';
export {
  usePauseReflectGeneration,
  type UsePauseReflectGenerationParams,
} from './presentation/use-pause-reflect-generation';
export { useCompanionSlotOrchestratePorts } from './presentation/use-companion-slot-orchestrate-ports';
export { usePauseReflectionStepLog } from './presentation/use-pause-reflection-step-log';
export { useCompanionAccess } from './presentation/use-companion-access';
export { useCompanionUiCompletion } from './presentation/use-companion-ui-completion';
export { useCompanionLibraryFavorites } from './presentation/use-companion-library-favorites';
export { useCompanionSlotUiState } from './presentation/use-companion-slot-ui-state';
export {
  useCompanionOrchestrateSession,
  type UseCompanionOrchestrateSessionParams,
} from './presentation/use-companion-orchestrate-session';
export {
  useCompanionInterventionFetch,
  type UseCompanionInterventionFetchParams,
} from './presentation/use-companion-intervention-fetch';
export {
  useCompanionOrchestrateRetry,
  type UseCompanionOrchestrateRetryParams,
} from './presentation/use-companion-orchestrate-retry';
export {
  useCompanionSlotOrchestrateFailurePorts,
  type UseCompanionSlotOrchestrateFailurePortsParams,
} from './presentation/use-companion-slot-orchestrate-failure-ports';
export {
  useCompanionInterventionBootstrap,
  type UseCompanionInterventionBootstrapParams,
} from './presentation/use-companion-intervention-bootstrap';
export {
  useCompanionSlotRunOrchestrate,
  type UseCompanionSlotRunOrchestrateParams,
} from './presentation/use-companion-slot-run-orchestrate';
export {
  useCompanionSlotOrchestrateActions,
  type UseCompanionSlotOrchestrateActionsParams,
} from './presentation/use-companion-slot-orchestrate-actions';
export {
  useCompanionOrchestration,
  type UseCompanionOrchestrationParams,
} from './presentation/use-companion-orchestration';
export { useCompanionData, type UseCompanionDataParams } from './presentation/use-companion-data';
export {
  useGroundingEnrichment,
  type GroundingEnrichment,
} from './presentation/use-grounding-enrichment';
export { usePauseSessionCompanionSnapshot } from './presentation/use-pause-session-companion-snapshot';
export {
  useFullviewTelemetry,
  type FullviewCompanion,
} from './presentation/use-fullview-telemetry';
export { usePauseFavoriteToggle } from './presentation/use-pause-favorite-toggle';
export { usePauseReflectFrameFocusAmbience } from './presentation/use-pause-reflect-frame-focus-ambience';
export { usePauseFeelShiftLogDedupeRefs } from './presentation/use-pause-feel-shift-log-dedupe-refs';
export { usePauseBreathSegmentRpcLoggers } from './presentation/use-pause-breath-segment-rpc-loggers';
export { usePauseSessionMountLog } from './presentation/use-pause-session-mount-log';
export { usePauseSessionGoBack } from './presentation/use-pause-session-go-back';
export { usePauseSessionGoToStep } from './presentation/use-pause-session-go-to-step';
export { usePauseSessionHeaderBackHandler } from './presentation/use-pause-session-header-back-handler';
export { usePauseSessionBreathTimedActiveReset } from './presentation/use-pause-session-breath-timed-active-reset';
export {
  usePauseSessionBreathUi,
  type UsePauseSessionBreathUiParams,
} from './presentation/use-pause-session-breath-ui';
export {
  usePauseSessionBriefToDeep,
  type UsePauseSessionBriefToDeepParams,
} from './presentation/use-pause-session-brief-to-deep';
export { usePauseSessionBreathStepHandlers } from './presentation/use-pause-session-breath-step-handlers';
export { usePauseShiftFrameDoneHandler } from './presentation/use-pause-shift-frame-done-handler';
export { usePauseSessionDecideHandler } from './presentation/use-pause-session-decide-handler';
export {
  usePauseSessionReflectAndDecide,
  type UsePauseSessionReflectAndDecideParams,
} from './presentation/use-pause-session-reflect-and-decide';
export { usePauseSessionDepthPickerHandlers } from './presentation/use-pause-session-depth-picker-handlers';
export { usePauseSessionFeelTilesSelect } from './presentation/use-pause-session-feel-tiles-select';
export { usePauseSessionInitialMoodHandlers } from './presentation/use-pause-session-initial-mood-handlers';
export { usePauseSessionPersistToStorage } from './presentation/use-pause-session-persist-to-storage';
export { usePauseSessionRitualStorageSync } from './presentation/use-pause-session-ritual-storage-sync';
export {
  usePauseSessionMoodAndPersist,
  type UsePauseSessionMoodAndPersistParams,
} from './presentation/use-pause-session-mood-and-persist';
export {
  usePauseSessionBreathNavigation,
  type UsePauseSessionBreathNavigationParams,
} from './presentation/use-pause-session-breath-navigation';
export {
  usePauseSessionBreathHandlers,
  type UsePauseSessionBreathHandlersParams,
} from './presentation/use-pause-session-breath-handlers';
export { usePauseSessionExitNavigation } from './presentation/use-pause-session-exit-navigation';
export { usePauseSessionPendingPauseOfferNavigation } from './presentation/use-pause-session-pending-pause-offer-navigation';
export { usePauseSessionPendingLeaveSheet } from './presentation/use-pause-session-pending-leave-sheet';
export { usePauseSessionMoodChromeHandlers } from './presentation/use-pause-session-mood-chrome-handlers';
export { usePauseSessionBreathReflectHandlers } from './presentation/use-pause-session-breath-reflect-handlers';
export { usePauseSessionEntryPresentationEffects } from './presentation/use-pause-session-entry-presentation-effects';
export { usePauseSessionTerminalEntryRedirect } from './presentation/use-pause-session-terminal-entry-redirect';
export { usePauseSessionStepTransition } from './presentation/use-pause-session-step-transition';
export { usePauseSessionDepthAndBriefCopy } from './presentation/use-pause-session-depth-and-brief-copy';
export {
  usePauseSessionScaffoldRitual,
  type UsePauseSessionScaffoldRitualParams,
  type PauseSessionScaffoldRitualDerivedParams,
} from './presentation/use-pause-session-scaffold-ritual';
export { usePauseSessionBreathSecondLabelVariant } from './presentation/use-pause-session-breath-second-label-variant';
export { usePauseSessionFetch } from './presentation/use-pause-session-fetch';
export {
  usePauseSessionBriefPastStep,
  type UsePauseSessionBriefPastStepParams,
} from './presentation/use-pause-session-brief-past-step';
export {
  usePauseSessionShell,
  type UsePauseSessionShellParams,
} from './presentation/use-pause-session-shell';
export {
  usePauseSessionShellBootstrap,
  type UsePauseSessionShellBootstrapParams,
} from './presentation/use-pause-session-shell-bootstrap';
export { usePauseSessionRitualState } from './presentation/use-pause-session-ritual-state';
export {
  usePauseSessionShellRitual,
  type PauseSessionShellRitualProvidersSlice,
  type PauseSessionShellRitualResult,
} from './presentation/use-pause-session-shell-ritual';
export {
  usePauseSessionStepHandlers,
  type PauseSessionStepHandlersResult,
} from './presentation/use-pause-session-step-handlers';
export type { PauseSessionStepHandlersProvidersSlice } from './presentation/session/pause-session-step-handler-types';
export {
  usePauseSessionScaffoldPresentation,
  type UsePauseSessionScaffoldPresentationParams,
} from './presentation/use-pause-session-scaffold-presentation';
export {
  usePauseSessionScaffoldVm,
  type PauseSessionScaffoldVmResult,
} from './presentation/use-pause-session-scaffold-vm';
export type {
  PauseSessionScaffoldVmChromeSlots,
  PauseSessionScaffoldVmProvidersSlice,
} from './presentation/session/pause-session-scaffold-vm-types';
export {
  usePauseSessionFlowCore,
  type PauseSessionFlowCoreProvidersSlice,
  type PauseSessionFlowCoreResult,
} from './presentation/use-pause-session-flow-core';
export {
  usePauseSessionRitualSurface,
  type PauseSessionRitualSurfaceMotionSlice,
  type PauseSessionRitualSurfaceResult,
} from './presentation/use-pause-session-ritual-surface';
export { usePauseSessionProviders } from './presentation/use-pause-session-providers';
export type {
  PauseSessionFlowConductorProvidersSlice,
  PauseSessionHolzenProvidersSlice,
  PauseSessionProviders,
  PauseSessionSubscriptionGateSlice,
} from './presentation/session/pause-session-providers-types';
export {
  usePauseSessionFlowThroughSteps,
  usePauseSessionFlowWithChrome,
} from './presentation/use-pause-session-flow';
export {
  usePauseSessionScreenViewModel,
  type PauseSessionScreenViewModel,
} from './presentation/use-pause-session-screen';
