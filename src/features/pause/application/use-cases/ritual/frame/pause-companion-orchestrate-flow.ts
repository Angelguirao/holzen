/**
 * CI cluster anchor for companion slot orchestrate presentation I/O (§3 / check:architecture-alignment).
 * Composes ritual/frame leaf modules directly (not orchestrate subcluster flow anchors).
 * `pause-companion-orchestrate-io.re-exports.test.ts` and `pause-companion-orchestrate-io-parity.test.ts`
 * may import this umbrella for parity; production orchestrate I/O keeps leaf imports.
 * Sibling cluster: `pause-companion-orchestrate-orchestration-flow-sibling-parity.test.ts` ↔ `pause-companion-orchestration-flow`.
 */
export {
  applyCompanionOrchestrateRetryReset,
  type CompanionOrchestrateRetryResetInput,
  type CompanionOrchestrateRetryResetPorts,
} from './apply-companion-orchestrate-retry-reset';
export { applyCompanionSlotOrchestrateOutcome } from './apply-companion-slot-orchestrate-outcome';
export type { ApplyCompanionSlotOrchestrateFailureUiPorts } from './companion-slot-orchestrate-failure-ui';
export type { CompanionOrchestrateSessionContext } from './build-companion-orchestrate-body';
export { logCompanionSlotOrchestrateInvoke } from './companion-slot-orchestrate-telemetry';
export { trackCompanionGenerationInitiated } from './companion-generation-telemetry';
export {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from './companion-slot-ui-state';
export { resetInterventionIdempotency } from './intervention-idempotency';
export {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from './orchestrate-slot-apply';
export {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
} from './run-companion-slot-orchestrate';
export {
  runCompanionInterventionBootstrap,
  type RunCompanionInterventionBootstrapPorts,
} from './run-companion-intervention-bootstrap';
