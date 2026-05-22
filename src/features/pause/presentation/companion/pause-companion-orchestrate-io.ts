/**
 * Companion slot orchestrate presentation I/O (orchestrate, intervention, retry, telemetry, UI state).
 * Imports ritual/frame leaf modules directly (parity with `pause-reflect-flows-io` → domain/decide peels).
 * Parity pins: `pause-companion-orchestrate-io.test.ts`, colocated `pause-companion-orchestrate-io-parity.test.ts`
 * (application mirror: `application/.../ritual/frame/pause-companion-orchestrate-io-parity.test.ts`),
 * `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts` ↔ `pause-companion-orchestration-io`,
 * `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts` ↔ `pause-companion-analytics-io`;
 * `pause-companion-orchestrate-frame-ui-io-sibling-parity.test.ts` ↔ `pause-companion-frame-ui-io`;
 * reciprocal inline pins: `pause-companion-orchestrate-io.test.ts` ↔ `pause-companion-frame-ui-io.test.ts`,
 * `pause-companion-analytics-io.test.ts`.
 */
import {
  applyCompanionOrchestrateRetryReset,
  type CompanionOrchestrateRetryResetInput,
  type CompanionOrchestrateRetryResetPorts,
} from '@/features/pause/application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset';
import { applyCompanionSlotOrchestrateOutcome } from '@/features/pause/application/use-cases/ritual/frame/apply-companion-slot-orchestrate-outcome';
import type { ApplyCompanionSlotOrchestrateFailureUiPorts } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-failure-ui';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import { resetInterventionIdempotency } from '@/features/pause/application/use-cases/ritual/frame/intervention-idempotency';
import {
  runCompanionInterventionBootstrap,
  type RunCompanionInterventionBootstrapPorts,
} from '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap';
import { logCompanionSlotOrchestrateInvoke } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-orchestrate-telemetry';
import { trackCompanionGenerationInitiated } from '@/features/pause/application/use-cases/ritual/frame/companion-generation-telemetry';
import {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
} from '@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate';
import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from '@/features/pause/application/use-cases/ritual/frame/companion-slot-ui-state';

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
