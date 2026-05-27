import { describe, expect, it } from 'vitest';

import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from './pause-companion-analytics-flow';
import * as analyticsFlow from './pause-companion-analytics-flow';
import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
} from './pause-companion-orchestrate-flow';
import * as orchestrateFlow from './pause-companion-orchestrate-flow';

/**
 * Application sibling parity: analytics-flow vs orchestrate-flow CI anchors (parity with
 * presentation `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts`;
 * complements `pause-companion-orchestrate-orchestration-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-companion-analytics-flow.test.ts`,
 * `pause-companion-orchestrate-flow.test.ts`.
 */
describe('pause-companion-analytics-flow ↔ pause-companion-orchestrate-flow sibling parity', () => {
  it('analytics-flow and orchestrate-flow are distinct sibling CI anchors', () => {
    expect(typeof runLogCompanionFeedbackVote).toBe('function');
    expect(typeof runLogCompanionFullviewOpened).toBe('function');

    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');
    expect(typeof setCompanionSlotError).toBe('function');
    expect(typeof setCompanionSlotLoading).toBe('function');
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({
      grounding: null,
      signal: null,
    });

    expect('runLogCompanionFeedbackVote' in analyticsFlow).toBe(true);
    expect('runLogCompanionFullviewOpened' in analyticsFlow).toBe(true);
    expect('runCompanionSlotOrchestrate' in analyticsFlow).toBe(false);

    expect('runCompanionSlotOrchestrate' in orchestrateFlow).toBe(true);
    expect('runLogCompanionFeedbackVote' in orchestrateFlow).toBe(false);
    expect('runLogCompanionFullviewOpened' in orchestrateFlow).toBe(false);
  });

  it('analytics-flow exports stay off slot orchestrate and retry UI', () => {
    expect(runLogCompanionFeedbackVote).not.toBe(runCompanionSlotOrchestrate);
    expect(runLogCompanionFeedbackVote).not.toBe(applyCompanionSlotOrchestrateOutcome);
    expect(runLogCompanionFullviewOpened).not.toBe(applyCompanionOrchestrateRetryReset);
    expect(runLogCompanionFeedbackVote).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(runLogCompanionFullviewOpened).not.toBe(trackCompanionGenerationInitiated);
    expect(runLogCompanionFeedbackVote).not.toBe(setCompanionSlotLoading);
    expect(runLogCompanionFullviewOpened).not.toBe(setCompanionSlotError);
    expect(runLogCompanionFullviewOpened).not.toBe(EMPTY_COMPANION_SLOT_RELAXATIONS);
  });

  it('orchestrate-flow exports stay off analytics write helpers', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(runLogCompanionFeedbackVote);
    expect(applyCompanionSlotOrchestrateOutcome).not.toBe(runLogCompanionFeedbackVote);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(runLogCompanionFullviewOpened);
    expect(trackCompanionGenerationInitiated).not.toBe(runLogCompanionFeedbackVote);
    expect(setCompanionSlotError).not.toBe(runLogCompanionFullviewOpened);
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).not.toBe(runLogCompanionFullviewOpened);
  });
});
