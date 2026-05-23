import { describe, expect, it } from 'vitest';

import { mapPersistedStep } from '@/features/pause/domain/session/map-persisted-step';

import {
  initialBreathingFirstCompletedFromRestored as initialBreathFirstFromBreathLeaf,
  initialBreathingSecondCompletedFromRestored as initialBreathSecondFromBreathLeaf,
} from '../ritual/breathe/restored-breath-ritual-state';
import {
  initialDecisionFromRestored as initialDecisionFromDecideLeaf,
  initialPhaseFromRestored as initialPhaseFromDecideLeaf,
} from '../ritual/decide/restored-decide-ritual-state';
import { initialFrameDoneFromRestored as initialFrameDoneFromFrameLeaf } from '../ritual/frame/restored-frame-ritual-state';
import { initialRitualEntry as initialRitualEntryFromLeaf } from './initial-ritual-entry';
import {
  initialBriefIntegrateDoneFromRestored as initialBriefIntegrateDoneFromBriefLeaf,
  initialBriefPauseStepFromRestored as initialBriefPauseStepFromBriefLeaf,
  initialSelectedBriefFaceFromRestored as initialSelectedBriefFaceFromBriefLeaf,
} from './restored-brief-ritual-state';
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
import { logPauseRitualDepthUpgraded as logBriefDepthUpgradedFromBriefFlow } from './pause-session-brief-flow';

describe('pause-session-ritual-restore-flow', () => {
  it('re-exports ritual restore helpers from domain + ritual/session leaf modules (not session *-flow umbrellas)', () => {
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
    expect(initialBreathFirstFromFlow).toBe(initialBreathFirstFromBreathLeaf);
    expect(initialBreathSecondFromFlow).toBe(initialBreathSecondFromBreathLeaf);
    expect(initialDecisionFromFlow).toBe(initialDecisionFromDecideLeaf);
    expect(initialPhaseFromFlow).toBe(initialPhaseFromDecideLeaf);
    expect(initialFrameDoneFromFlow).toBe(initialFrameDoneFromFrameLeaf);
    expect(initialBriefPauseStepFromFlow).toBe(initialBriefPauseStepFromBriefLeaf);
    expect(initialBriefIntegrateDoneFromFlow).toBe(initialBriefIntegrateDoneFromBriefLeaf);
    expect(initialSelectedBriefFaceFromFlow).toBe(initialSelectedBriefFaceFromBriefLeaf);
    expect(initialRitualEntryFromFlow).toBe(initialRitualEntryFromLeaf);
  });

  it('re-exports restored breath hydration via restored-breath-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });

    expect(initialBreathFirstFromFlow(restored)).toBe(true);
    expect(initialBreathSecondFromFlow(restored)).toBe(false);
    expect(initialBreathFirstFromFlow(null)).toBe(false);
  });

  it('re-exports restored decide hydration via restored-decide-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({
      decision: 'hold',
      phase: 'done',
    });

    expect(initialDecisionFromFlow(restored)).toBe('hold');
    expect(initialPhaseFromFlow(restored)).toBe('done');
    expect(initialDecisionFromFlow(null)).toBeNull();
  });

  it('re-exports restored frame hydration via restored-frame-ritual-state', () => {
    expect(initialFrameDoneFromFlow(makeTestPersistedPauseSession({ frameDone: true }))).toBe(true);
    expect(initialFrameDoneFromFlow(null)).toBe(false);
  });

  it('re-exports restored brief hydration via restored-brief-ritual-state + initial-ritual-entry', () => {
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

  it('sibling cluster: brief-flow depth-upgrade export stays off ritual-restore umbrella', () => {
    expect(mapPersistedStepFromFlow).not.toBe(logBriefDepthUpgradedFromBriefFlow);
    expect(initialBreathFirstFromFlow).not.toBe(logBriefDepthUpgradedFromBriefFlow);
    expect(initialRitualEntryFromFlow).not.toBe(logBriefDepthUpgradedFromBriefFlow);
    expect(initialBriefPauseStepFromFlow).not.toBe(logBriefDepthUpgradedFromBriefFlow);
  });
});
