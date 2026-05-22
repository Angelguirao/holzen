import { describe, expect, it } from 'vitest';

import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from './pause-session-decide-flow';
import type { PauseImpactData } from './pause-session-decide-flow';
import {
  initialDecisionFromRestored as initialDecisionDirect,
  initialPhaseFromRestored as initialPhaseDirect,
} from '../ritual/decide/restored-decide-ritual-state';
import type { PauseImpactData as PauseImpactDataDirect } from '@/features/pause/domain/decide/pause-impact-data';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-decide-flow', () => {
  it('re-exports restored decide hydration from restored-decide-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({
      phase: 'done',
      decision: 'hold',
    });

    expect(initialPhaseFromRestored(restored)).toBe('done');
    expect(initialDecisionFromRestored(restored)).toBe('hold');
    expect(initialPhaseFromRestored(null)).toBe('session');
    expect(initialDecisionFromRestored(null)).toBeNull();
    expect(initialPhaseFromRestored).toBe(initialPhaseDirect);
    expect(initialDecisionFromRestored).toBe(initialDecisionDirect);
  });

  it('re-exports PauseImpactData from domain/decide/pause-impact-data', () => {
    const sample: PauseImpactData = {
      mood: null,
      moodAfter: null,
      breathingCompleted: false,
      decision: null,
      context: null,
      engagedTools: 0,
      wroteNote: false,
      usedTags: false,
    };
    const direct: PauseImpactDataDirect = sample;
    expect(direct.engagedTools).toBe(0);
  });
});
