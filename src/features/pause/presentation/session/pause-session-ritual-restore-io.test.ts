import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/domain/ritual/breathe/restored-breath-ritual-state', () => ({
  initialBreathingFirstCompletedFromRestored: vi.fn(),
  initialBreathingSecondCompletedFromRestored: vi.fn(),
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/restored-decide-ritual-state', () => ({
  initialDecisionFromRestored: vi.fn(),
  initialPhaseFromRestored: vi.fn(),
}));

vi.mock('@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state', () => ({
  initialFrameDoneFromRestored: vi.fn(),
}));

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
} from './pause-session-ritual-restore-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-ritual-restore-io', () => {
  it('re-exports restored brief ritual fields from session use-case siblings', () => {
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
