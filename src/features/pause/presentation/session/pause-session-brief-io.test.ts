import { describe, expect, it, vi } from 'vitest';

const logPauseRitualDepthUpgradedMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade', () => ({
  logPauseRitualDepthUpgraded: logPauseRitualDepthUpgradedMock,
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'briefRepository' },
}));

import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  pauseBriefRitualDepthUpgraded,
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

  it('routes brief depth upgrade through default PauseRepository port', async () => {
    logPauseRitualDepthUpgradedMock.mockResolvedValue({ status: 'success' });

    await pauseBriefRitualDepthUpgraded('pi-brief');

    expect(logPauseRitualDepthUpgradedMock).toHaveBeenCalledWith(
      { port: 'briefRepository' },
      'pi-brief',
    );
  });
});
