/**
 * CI cluster anchor for companion slot orchestrate presentation I/O (§3 / check:architecture-alignment).
 * Composes orchestrate subcluster anchors; presentation imports via `pause-companion-orchestrate-io.ts`.
 */
export {
  applyCompanionOrchestrateRetryReset,
  type CompanionOrchestrateRetryResetInput,
  type CompanionOrchestrateRetryResetPorts,
} from './pause-companion-orchestrate-retry-flow';
export { applyCompanionSlotOrchestrateOutcome } from './pause-companion-orchestrate-outcome-flow';
export type { CompanionOrchestrateSessionContext } from './pause-companion-slot-orchestrate-flow';
export {
  logCompanionSlotOrchestrateInvoke,
  trackCompanionGenerationInitiated,
} from './pause-companion-slot-orchestrate-telemetry-flow';
export type { ApplyCompanionSlotOrchestrateFailureUiPorts } from './pause-companion-orchestrate-outcome-flow';
export {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from './pause-companion-slot-orchestrate-ui-flow';
export { resetInterventionIdempotency } from './pause-companion-intervention-orchestrate-flow';
export {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from './pause-companion-orchestrate-slot-apply-flow';
export {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
} from './pause-companion-slot-orchestrate-flow';
export {
  runCompanionInterventionBootstrap,
  type RunCompanionInterventionBootstrapPorts,
} from './pause-companion-intervention-orchestrate-flow';
