import { describe, expect, it } from 'vitest';

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  logPauseRitualDepthUpgraded,
} from './pause-session-brief-flow';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-brief-flow', () => {
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

  it('re-exports ritual entry and brief depth-upgrade RPC from siblings', () => {
    expect(typeof initialRitualEntry).toBe('function');
    expect(typeof logPauseRitualDepthUpgraded).toBe('function');
  });
});
