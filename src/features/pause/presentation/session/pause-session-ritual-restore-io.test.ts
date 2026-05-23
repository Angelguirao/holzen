import { describe, expect, it } from 'vitest';

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  mapPersistedStep,
} from './pause-session-ritual-restore-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-ritual-restore-io', () => {
  it('re-exports restored brief ritual fields from session + ritual subcluster modules', () => {
    const restored = makeTestPersistedPauseSession({
      ritualDepth: 'brief',
      briefStep: 'integrate',
      briefIntegrateDone: true,
      briefFace: 'calm',
    });

    expect(initialBriefPauseStepFromRestored(restored)).toBe('integrate');
    expect(initialBriefIntegrateDoneFromRestored(restored)).toBe(true);
    expect(initialSelectedBriefFaceFromRestored(restored)).toBe('calm');
    expect(initialRitualEntry(restored)).toBe('brief');
    expect(initialBriefPauseStepFromRestored(null)).toBe('feel');
    expect(initialRitualEntry(null)).toBe('picker');
  });

  it('re-exports mapPersistedStep from domain session mapper', () => {
    expect(mapPersistedStep('reflect')).toBe('reflect');
    expect(mapPersistedStep(undefined)).toBe('feel');
  });
});
