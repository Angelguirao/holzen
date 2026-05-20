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
