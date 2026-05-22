/**
 * Companion slot orchestrate presentation I/O (orchestrate, intervention, retry, telemetry, UI state).
 * Imports ritual/frame use cases via `pause-companion-orchestrate-flow` CI anchor
 * (parity with `pause-reflect-mood-io` → mood flow).
 */
import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  resetInterventionIdempotency,
  runCompanionInterventionBootstrap,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
  type ApplyCompanionSlotOrchestrateFailureUiPorts,
  type CompanionOrchestrateRetryResetInput,
  type CompanionOrchestrateRetryResetPorts,
  type CompanionOrchestrateSessionContext,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
  type CompanionSlotOrchestrateMode,
  type CompanionSlotRelaxations,
  type RunCompanionInterventionBootstrapPorts,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow';

export { companionOrchestrator } from './pause-companion-orchestration-io';

export type {
  ApplyCompanionSlotOrchestrateFailureUiPorts,
  CompanionOrchestrateRetryResetInput,
  CompanionOrchestrateRetryResetPorts,
  CompanionOrchestrateSessionContext,
  CompanionSlotAutosaveParams,
  CompanionSlotCacheIds,
  CompanionSlotCommitters,
  CompanionSlotErrorSetters,
  CompanionSlotLoadingSetters,
  CompanionSlotOrchestrateMode,
  CompanionSlotRelaxations,
  RunCompanionInterventionBootstrapPorts,
};

export {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  resetInterventionIdempotency,
  runCompanionInterventionBootstrap,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
};
