import { describe, expect, it } from 'vitest';

import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialDecisionFromRestored,
  initialFrameDoneFromRestored,
  initialPhaseFromRestored,
} from './pause-session-ritual-restore-flow';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-ritual-restore-flow', () => {
  it('re-exports restored breath hydration from restored-breath-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });

    expect(initialBreathingFirstCompletedFromRestored(restored)).toBe(true);
    expect(initialBreathingSecondCompletedFromRestored(restored)).toBe(false);
    expect(initialBreathingFirstCompletedFromRestored(null)).toBe(false);
  });

  it('re-exports restored decide hydration from restored-decide-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({
      decision: 'hold',
      phase: 'decide',
    });

    expect(initialDecisionFromRestored(restored)).toBe('hold');
    expect(initialPhaseFromRestored(restored)).toBe('decide');
    expect(initialDecisionFromRestored(null)).toBeNull();
  });

  it('re-exports restored frame hydration from restored-frame-ritual-state', () => {
    expect(initialFrameDoneFromRestored(makeTestPersistedPauseSession({ frameDone: true }))).toBe(
      true,
    );
    expect(initialFrameDoneFromRestored(null)).toBe(false);
  });
});
