import { describe, expect, it } from 'vitest';
import {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
} from './pause-session-shell-io';

describe('pause-session-shell-io', () => {
  it('re-exports header back visibility and intent helpers for session conductors', () => {
    expect(
      isPauseSessionHeaderBackVisible({
        phase: 'session',
        ritualEntry: 'brief',
        briefStep: 'breath',
        step: 'feel',
        breathTimedActive: false,
        breathFirstTimedPatternStarted: false,
        breathSecondTimedPatternStarted: false,
        breathingFirstCompleted: false,
        breathingSecondCompleted: false,
      }),
    ).toBe(true);

    expect(
      computePauseHeaderBackIntent({
        ritualEntry: 'brief',
        briefStep: 'breath',
        step: 'feel',
        breathTimedActive: false,
        breathingFirstCompleted: false,
        breathingSecondCompleted: false,
      }),
    ).toEqual({ kind: 'go_back' });
  });
});
