import { describe, expect, it } from 'vitest';

import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from './pause-companion-analytics-flow';
import { applyCompanionOrchestrateRetryReset as applyRetryResetDirect } from './apply-companion-orchestrate-retry-reset';
import { applyCompanionSlotOrchestrateOutcome as applyOutcomeDirect } from './apply-companion-slot-orchestrate-outcome';
import { logCompanionSlotOrchestrateInvoke as logInvokeDirect } from './companion-slot-orchestrate-telemetry';
import { trackCompanionGenerationInitiated as trackGenerationDirect } from './companion-generation-telemetry';
import {
  setCompanionSlotError as setErrorDirect,
  setCompanionSlotLoading as setLoadingDirect,
} from './companion-slot-ui-state';
import { EMPTY_COMPANION_SLOT_RELAXATIONS as emptyRelaxationsDirect } from './orchestrate-slot-apply';
import { resetInterventionIdempotency as resetIdempotencyDirect } from './intervention-idempotency';
import { runCompanionInterventionBootstrap as runBootstrapDirect } from './run-companion-intervention-bootstrap';
import { runCompanionSlotOrchestrate as runSlotOrchestrateDirect } from './run-companion-slot-orchestrate';
import {
  applyCompanionOrchestrateRetryReset as applyRetryResetFromRetryFlow,
} from './pause-companion-orchestrate-retry-flow';
import {
  applyCompanionSlotOrchestrateOutcome as applyOutcomeFromOutcomeFlow,
} from './pause-companion-orchestrate-outcome-flow';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS as emptyRelaxationsFromSlotApplyFlow,
} from './pause-companion-orchestrate-slot-apply-flow';
import {
  resetInterventionIdempotency as resetIdempotencyFromInterventionFlow,
  runCompanionInterventionBootstrap as runBootstrapFromInterventionFlow,
} from './pause-companion-intervention-orchestrate-flow';
import {
  logCompanionSlotOrchestrateInvoke as logInvokeFromTelemetryFlow,
  trackCompanionGenerationInitiated as trackGenerationFromTelemetryFlow,
} from './pause-companion-slot-orchestrate-telemetry-flow';
import {
  setCompanionSlotError as setErrorFromUiFlow,
  setCompanionSlotLoading as setLoadingFromUiFlow,
} from './pause-companion-slot-orchestrate-ui-flow';
import { runCompanionSlotOrchestrate as runSlotOrchestrateFromSlotFlow } from './pause-companion-slot-orchestrate-flow';

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
} from './pause-companion-orchestrate-flow';

describe('pause-companion-orchestrate-flow', () => {
  it('re-exports orchestrate helpers via ritual/frame orchestrate subcluster CI anchors', () => {
    expect(applyCompanionOrchestrateRetryReset).toBe(applyRetryResetFromRetryFlow);
    expect(applyCompanionSlotOrchestrateOutcome).toBe(applyOutcomeFromOutcomeFlow);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toBe(emptyRelaxationsFromSlotApplyFlow);
    expect(resetInterventionIdempotency).toBe(resetIdempotencyFromInterventionFlow);
    expect(runCompanionInterventionBootstrap).toBe(runBootstrapFromInterventionFlow);
    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeFromTelemetryFlow);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationFromTelemetryFlow);
    expect(setCompanionSlotError).toBe(setErrorFromUiFlow);
    expect(setCompanionSlotLoading).toBe(setLoadingFromUiFlow);
    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateFromSlotFlow);
  });

  it('re-exports orchestrate leaf modules for slot run, intervention, retry, outcome, telemetry, and UI state', () => {
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof resetInterventionIdempotency).toBe('function');
    expect(typeof runCompanionInterventionBootstrap).toBe('function');
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof setCompanionSlotError).toBe('function');
    expect(typeof setCompanionSlotLoading).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');

    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toBe(emptyRelaxationsDirect);

    expect(applyCompanionOrchestrateRetryReset).toBe(applyRetryResetDirect);
    expect(applyCompanionSlotOrchestrateOutcome).toBe(applyOutcomeDirect);
    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeDirect);
    expect(resetInterventionIdempotency).toBe(resetIdempotencyDirect);
    expect(runCompanionInterventionBootstrap).toBe(runBootstrapDirect);
    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateDirect);
    expect(setCompanionSlotError).toBe(setErrorDirect);
    expect(setCompanionSlotLoading).toBe(setLoadingDirect);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationDirect);
  });

  /**
   * Reciprocal inline pins ↔ `pause-companion-analytics-flow.test.ts`.
   * Dedicated sibling file: `pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: analytics-flow exports stay distinct from orchestrate-flow', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(runLogCompanionFeedbackVote);
    expect(runCompanionInterventionBootstrap).not.toBe(runLogCompanionFullviewOpened);
    expect(applyCompanionOrchestrateRetryReset).not.toBe(runLogCompanionFeedbackVote);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(runLogCompanionFullviewOpened);
    expect(trackCompanionGenerationInitiated).not.toBe(runLogCompanionFeedbackVote);
    expect(setCompanionSlotError).not.toBe(runLogCompanionFullviewOpened);
    expect(resetInterventionIdempotency).not.toBe(runLogCompanionFeedbackVote);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).not.toBe(runLogCompanionFullviewOpened);
    // Full cross-flow pins: `pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`.
  });
});
