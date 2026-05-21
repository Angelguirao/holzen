import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: {},
}));

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
} from './pause-session-brief-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-brief-io', () => {
  it('re-exports restored brief ritual fields for session hydration', () => {
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
});
