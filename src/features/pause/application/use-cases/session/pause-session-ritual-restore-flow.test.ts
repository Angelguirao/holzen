import { describe, expect, it } from 'vitest';

import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
} from '@/features/pause/application/use-cases/ritual/breathe/restored-breath-ritual-state';
import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '@/features/pause/application/use-cases/ritual/decide/restored-decide-ritual-state';
import { initialFrameDoneFromRestored } from '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state';
import { mapPersistedStep } from '@/features/pause/domain/session/map-persisted-step';

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from './restored-brief-ritual-state';
import { initialRitualEntry } from './initial-ritual-entry';
import {
  initialBreathingFirstCompletedFromRestored as initialBreathFirstFromFlow,
  initialBreathingSecondCompletedFromRestored as initialBreathSecondFromFlow,
  initialBriefIntegrateDoneFromRestored as initialBriefIntegrateDoneFromFlow,
  initialBriefPauseStepFromRestored as initialBriefPauseStepFromFlow,
  initialDecisionFromRestored as initialDecisionFromFlow,
  initialFrameDoneFromRestored as initialFrameDoneFromFlow,
  initialPhaseFromRestored as initialPhaseFromFlow,
  initialRitualEntry as initialRitualEntryFromFlow,
  initialSelectedBriefFaceFromRestored as initialSelectedBriefFaceFromFlow,
  mapPersistedStep as mapPersistedStepFromFlow,
} from './pause-session-ritual-restore-flow';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-ritual-restore-flow', () => {
  it('re-exports ritual restore helpers from domain + ritual/session siblings', () => {
    expect(typeof mapPersistedStepFromFlow).toBe('function');
    expect(typeof initialBreathFirstFromFlow).toBe('function');
    expect(typeof initialBreathSecondFromFlow).toBe('function');
    expect(typeof initialDecisionFromFlow).toBe('function');
    expect(typeof initialPhaseFromFlow).toBe('function');
    expect(typeof initialFrameDoneFromFlow).toBe('function');
    expect(typeof initialBriefPauseStepFromFlow).toBe('function');
    expect(typeof initialBriefIntegrateDoneFromFlow).toBe('function');
    expect(typeof initialSelectedBriefFaceFromFlow).toBe('function');
    expect(typeof initialRitualEntryFromFlow).toBe('function');

    expect(mapPersistedStepFromFlow).toBe(mapPersistedStep);
    expect(initialBreathFirstFromFlow).toBe(initialBreathingFirstCompletedFromRestored);
    expect(initialBreathSecondFromFlow).toBe(initialBreathingSecondCompletedFromRestored);
    expect(initialDecisionFromFlow).toBe(initialDecisionFromRestored);
    expect(initialPhaseFromFlow).toBe(initialPhaseFromRestored);
    expect(initialFrameDoneFromFlow).toBe(initialFrameDoneFromRestored);
    expect(initialBriefPauseStepFromFlow).toBe(initialBriefPauseStepFromRestored);
    expect(initialBriefIntegrateDoneFromFlow).toBe(initialBriefIntegrateDoneFromRestored);
    expect(initialSelectedBriefFaceFromFlow).toBe(initialSelectedBriefFaceFromRestored);
    expect(initialRitualEntryFromFlow).toBe(initialRitualEntry);
  });

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
