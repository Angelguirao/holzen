import { describe, expect, it } from 'vitest';

import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialDecisionFromRestored,
  initialFrameDoneFromRestored,
  initialPhaseFromRestored,
  initialSelectedBriefFaceFromRestored,
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

  it('re-exports restored brief hydration from restored-brief-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({
      ritualDepth: 'brief',
      briefStep: 'integrate',
      briefIntegrateDone: true,
      briefFace: 'calm',
    });

    expect(initialBriefPauseStepFromRestored(restored)).toBe('integrate');
    expect(initialBriefIntegrateDoneFromRestored(restored)).toBe(true);
    expect(initialSelectedBriefFaceFromRestored(restored)).toBe('calm');
    expect(initialBriefPauseStepFromRestored(null)).toBe('feel');
  });
});
