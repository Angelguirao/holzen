import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/features/pause/application/use-cases/session/pause-session-ritual-restore-flow',
  async () => {
    const actual = await vi.importActual<
      typeof import('@/features/pause/application/use-cases/session/pause-session-ritual-restore-flow')
    >('@/features/pause/application/use-cases/session/pause-session-ritual-restore-flow');
    return {
      ...actual,
      initialBreathingFirstCompletedFromRestored: vi.fn(),
      initialBreathingSecondCompletedFromRestored: vi.fn(),
      initialDecisionFromRestored: vi.fn(),
      initialPhaseFromRestored: vi.fn(),
      initialFrameDoneFromRestored: vi.fn(),
    };
  },
);

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  mapPersistedStep,
} from './pause-session-ritual-restore-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-ritual-restore-io', () => {
  it('re-exports restored brief ritual fields from pause-session-ritual-restore-flow', () => {
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

  it('re-exports mapPersistedStep from pause-session-ritual-restore-flow', () => {
    expect(mapPersistedStep('reflect')).toBe('reflect');
    expect(mapPersistedStep(undefined)).toBe('feel');
  });
});
