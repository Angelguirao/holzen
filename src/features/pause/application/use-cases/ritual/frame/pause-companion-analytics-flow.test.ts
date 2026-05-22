import { describe, expect, it } from 'vitest';

import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from './pause-companion-analytics-flow';

describe('pause-companion-analytics-flow', () => {
  it('re-exports companion analytics use cases from ritual/frame leaf modules', () => {
    expect(typeof runLogCompanionFeedbackVote).toBe('function');
    expect(typeof runLogCompanionFullviewOpened).toBe('function');
  });
});
