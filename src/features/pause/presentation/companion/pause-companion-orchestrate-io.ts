/**
 * Companion slot orchestrate presentation I/O (orchestrate, intervention, retry, telemetry, UI state).
 * Imports ritual/frame use cases directly (parity with reflect presentation I/O subcluster peels).
 */
import {
  applyCompanionOrchestrateRetryReset,
  type CompanionOrchestrateRetryResetInput,
  type CompanionOrchestrateRetryResetPorts,
} from '@/features/pause/application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset';
import { applyCompanionSlotOrchestrateOutcome } from '@/features/pause/application/use-cases/ritual/frame/apply-companion-slot-orchestrate-outcome';
import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import { logCompanionSlotOrchestrateInvoke } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-telemetry';
import { trackCompanionGenerationInitiated } from '@/features/pause/application/use-cases/ritual/frame/companion-generation-telemetry';
import type { ApplyCompanionSlotOrchestrateFailureUiPorts } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-failure-ui';
import {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from '@/features/pause/application/use-cases/ritual/frame/companion-slot-ui-state';
import { resetInterventionIdempotency } from '@/features/pause/application/use-cases/ritual/frame/intervention-idempotency';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
} from '@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate';
import {
  runCompanionInterventionBootstrap,
  type RunCompanionInterventionBootstrapPorts,
} from '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap';

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
