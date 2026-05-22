import { describe, expect, it } from 'vitest';

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
  });
});
