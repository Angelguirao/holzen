import { describe, expect, it } from 'vitest';

import { applyCompanionOrchestrateRetryReset as applyRetryResetDirect } from './apply-companion-orchestrate-retry-reset';
import { applyCompanionSlotOrchestrateOutcome as applyOutcomeDirect } from './apply-companion-slot-orchestrate-outcome';
import { logCompanionSlotOrchestrateInvoke as logInvokeDirect } from './companion-slot-orchestrate-telemetry';
import { trackCompanionGenerationInitiated as trackGenerationDirect } from './companion-generation-telemetry';
import {
  setCompanionSlotError as setErrorDirect,
  setCompanionSlotLoading as setLoadingDirect,
} from './companion-slot-ui-state';
import { resetInterventionIdempotency as resetIdempotencyDirect } from './intervention-idempotency';
import { runCompanionInterventionBootstrap as runBootstrapDirect } from './run-companion-intervention-bootstrap';
import { runCompanionSlotOrchestrate as runSlotOrchestrateDirect } from './run-companion-slot-orchestrate';

import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  logCompanionSlotOrchestrateInvoke,
  resetInterventionIdempotency,
  runCompanionInterventionBootstrap,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  trackCompanionGenerationInitiated,
} from './pause-companion-orchestrate-flow';

describe('pause-companion-orchestrate-flow', () => {
  it('re-exports orchestrate leaf modules for slot run, intervention, retry, outcome, telemetry, and UI state', () => {
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof resetInterventionIdempotency).toBe('function');
    expect(typeof runCompanionInterventionBootstrap).toBe('function');
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof setCompanionSlotError).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');

    expect(applyCompanionOrchestrateRetryReset).toBe(applyRetryResetDirect);
    expect(applyCompanionSlotOrchestrateOutcome).toBe(applyOutcomeDirect);
    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeDirect);
    expect(resetInterventionIdempotency).toBe(resetIdempotencyDirect);
    expect(runCompanionInterventionBootstrap).toBe(runBootstrapDirect);
    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateDirect);
    expect(setCompanionSlotError).toBe(setErrorDirect);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationDirect);
  });
});
