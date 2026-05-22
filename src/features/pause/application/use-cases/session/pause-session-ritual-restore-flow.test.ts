import { describe, expect, it } from 'vitest';

import { mapPersistedStep } from '@/features/pause/domain/session/map-persisted-step';

import {
  initialBreathingFirstCompletedFromRestored as initialBreathFirstFromBreathFlow,
  initialBreathingSecondCompletedFromRestored as initialBreathSecondFromBreathFlow,
} from '../ritual/breathe/pause-session-breath-flow';
import {
  initialDecisionFromRestored as initialDecisionFromDecideFlow,
  initialPhaseFromRestored as initialPhaseFromDecideFlow,
} from './pause-session-decide-flow';
import { initialFrameDoneFromRestored as initialFrameDoneFromFrameFlow } from './pause-session-frame-flow';
import {
  initialBriefIntegrateDoneFromRestored as initialBriefIntegrateDoneFromBriefFlow,
  initialBriefPauseStepFromRestored as initialBriefPauseStepFromBriefFlow,
  initialRitualEntry as initialRitualEntryFromBriefFlow,
  initialSelectedBriefFaceFromRestored as initialSelectedBriefFaceFromBriefFlow,
} from './pause-session-brief-flow';
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
  it('re-exports ritual restore helpers from domain + session subcluster CI anchors', () => {
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
    expect(initialBreathFirstFromFlow).toBe(initialBreathFirstFromBreathFlow);
    expect(initialBreathSecondFromFlow).toBe(initialBreathSecondFromBreathFlow);
    expect(initialDecisionFromFlow).toBe(initialDecisionFromDecideFlow);
    expect(initialPhaseFromFlow).toBe(initialPhaseFromDecideFlow);
    expect(initialFrameDoneFromFlow).toBe(initialFrameDoneFromFrameFlow);
    expect(initialBriefPauseStepFromFlow).toBe(initialBriefPauseStepFromBriefFlow);
    expect(initialBriefIntegrateDoneFromFlow).toBe(initialBriefIntegrateDoneFromBriefFlow);
    expect(initialSelectedBriefFaceFromFlow).toBe(initialSelectedBriefFaceFromBriefFlow);
    expect(initialRitualEntryFromFlow).toBe(initialRitualEntryFromBriefFlow);
  });

  it('re-exports restored breath hydration via pause-session-breath-flow', () => {
    const restored = makeTestPersistedPauseSession({
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });

    expect(initialBreathFirstFromFlow(restored)).toBe(true);
    expect(initialBreathSecondFromFlow(restored)).toBe(false);
    expect(initialBreathFirstFromFlow(null)).toBe(false);
  });

  it('re-exports restored decide hydration via pause-session-decide-flow', () => {
    const restored = makeTestPersistedPauseSession({
      decision: 'hold',
      phase: 'decide',
    });

    expect(initialDecisionFromFlow(restored)).toBe('hold');
    expect(initialPhaseFromFlow(restored)).toBe('decide');
    expect(initialDecisionFromFlow(null)).toBeNull();
  });

  it('re-exports restored frame hydration via pause-session-frame-flow', () => {
    expect(initialFrameDoneFromFlow(makeTestPersistedPauseSession({ frameDone: true }))).toBe(true);
    expect(initialFrameDoneFromFlow(null)).toBe(false);
  });

  it('re-exports restored brief hydration via pause-session-brief-flow', () => {
    const restored = makeTestPersistedPauseSession({
      ritualDepth: 'brief',
      briefStep: 'integrate',
      briefIntegrateDone: true,
      briefFace: 'calm',
    });

    expect(initialBriefPauseStepFromFlow(restored)).toBe('integrate');
    expect(initialBriefIntegrateDoneFromFlow(restored)).toBe(true);
    expect(initialSelectedBriefFaceFromFlow(restored)).toBe('calm');
    expect(initialBriefPauseStepFromFlow(null)).toBe('feel');
  });
});
