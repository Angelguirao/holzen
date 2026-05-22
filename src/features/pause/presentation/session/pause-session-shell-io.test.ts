import { describe, expect, it } from 'vitest';
import {
  computePauseHeaderBackIntent,
  computePauseSessionHydration,
  computePauseSessionResolved,
  hasPersistedPauseSessionPayload,
  isPauseSessionHeaderBackVisible,
  isPauseSessionWaitingForInstanceFetch,
} from './pause-session-shell-io';

describe('pause-session-shell-io', () => {
  it('re-exports hydration helpers from session shell subcluster modules', () => {
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(typeof hasPersistedPauseSessionPayload).toBe('function');
    expect(typeof isPauseSessionWaitingForInstanceFetch).toBe('function');
  });

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
