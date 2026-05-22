import { describe, expect, it } from 'vitest';

import { runLogCompanionFeedbackVote as runFeedbackVoteDirect } from './run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened as runFullviewOpenedDirect } from './run-log-companion-fullview-opened';

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
});
