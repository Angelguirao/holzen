/**
 * Companion slot orchestrate presentation I/O (orchestrate, intervention, retry, telemetry, UI state).
 * Imports ritual/frame use cases via orchestrate subcluster flow anchors
 * (parity with `pause-companion-orchestration-io` / reflect hub I/O peels).
 */
import {
  applyCompanionOrchestrateRetryReset,
  type CompanionOrchestrateRetryResetInput,
  type CompanionOrchestrateRetryResetPorts,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-retry-flow';
import {
  applyCompanionSlotOrchestrateOutcome,
  type ApplyCompanionSlotOrchestrateFailureUiPorts,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-outcome-flow';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-slot-apply-flow';
import {
  resetInterventionIdempotency,
  runCompanionInterventionBootstrap,
  type RunCompanionInterventionBootstrapPorts,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-intervention-orchestrate-flow';
import {
  logCompanionSlotOrchestrateInvoke,
  trackCompanionGenerationInitiated,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-telemetry-flow';
import {
  runCompanionSlotOrchestrate,
  type CompanionOrchestrateSessionContext,
  type CompanionSlotOrchestrateMode,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-flow';
import {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-slot-orchestrate-ui-flow';

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
