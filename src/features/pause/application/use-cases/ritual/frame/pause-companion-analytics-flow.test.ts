import { describe, expect, it } from 'vitest';

import { runLogCompanionFeedbackVote as runFeedbackVoteDirect } from './run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened as runFullviewOpenedDirect } from './run-log-companion-fullview-opened';
import {
  runCompanionInterventionBootstrap,
  runCompanionSlotOrchestrate,
} from './pause-companion-orchestrate-flow';

import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from './pause-companion-analytics-flow';

describe('pause-companion-analytics-flow', () => {
  it('re-exports companion analytics use cases from ritual/frame leaf modules', () => {
    expect(typeof runLogCompanionFeedbackVote).toBe('function');
    expect(typeof runLogCompanionFullviewOpened).toBe('function');

    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteDirect);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedDirect);
  });

  /**
   * Reciprocal inline pins ↔ `pause-companion-orchestrate-flow.test.ts`.
   * Dedicated sibling file: `pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: orchestrate-flow exports stay distinct from analytics-flow', () => {
    expect(runLogCompanionFeedbackVote).not.toBe(runCompanionSlotOrchestrate);
    expect(runLogCompanionFullviewOpened).not.toBe(runCompanionInterventionBootstrap);
    expect(runLogCompanionFeedbackVote).not.toBe(runCompanionInterventionBootstrap);
    expect(runLogCompanionFullviewOpened).not.toBe(runCompanionSlotOrchestrate);
    // Full cross-flow pins: `pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`.
  });
});
