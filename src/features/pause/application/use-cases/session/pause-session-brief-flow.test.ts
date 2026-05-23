import { describe, expect, it } from 'vitest';

import { logPauseRitualDepthUpgraded } from '@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade';

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from './restored-brief-ritual-state';
import { initialRitualEntry } from './initial-ritual-entry';
import {
  initialBriefIntegrateDoneFromRestored as initialBriefIntegrateDoneFromFlow,
  initialBriefPauseStepFromRestored as initialBriefPauseStepFromFlow,
  initialRitualEntry as initialRitualEntryFromFlow,
  initialSelectedBriefFaceFromRestored as initialSelectedBriefFaceFromFlow,
  logPauseRitualDepthUpgraded as logDepthUpgradedFromFlow,
} from './pause-session-brief-flow';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-brief-flow', () => {
  it('re-exports restored brief hydration from restored-brief-ritual-state siblings', () => {
    expect(typeof initialBriefPauseStepFromFlow).toBe('function');
    expect(typeof initialBriefIntegrateDoneFromFlow).toBe('function');
    expect(typeof initialSelectedBriefFaceFromFlow).toBe('function');
    expect(initialBriefPauseStepFromFlow).toBe(initialBriefPauseStepFromRestored);
    expect(initialBriefIntegrateDoneFromFlow).toBe(initialBriefIntegrateDoneFromRestored);
    expect(initialSelectedBriefFaceFromFlow).toBe(initialSelectedBriefFaceFromRestored);
  });

  it('hydrates brief ritual fields from restored session', () => {
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

  it('re-exports ritual entry and brief depth-upgrade RPC from siblings', () => {
    expect(typeof initialRitualEntryFromFlow).toBe('function');
    expect(typeof logDepthUpgradedFromFlow).toBe('function');
    expect(initialRitualEntryFromFlow).toBe(initialRitualEntry);
    expect(logDepthUpgradedFromFlow).toBe(logPauseRitualDepthUpgraded);
  });
});
