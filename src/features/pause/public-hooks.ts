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
