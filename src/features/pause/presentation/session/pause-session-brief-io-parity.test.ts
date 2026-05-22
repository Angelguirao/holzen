import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade', () => ({
  logPauseRitualDepthUpgraded: vi.fn(() => Promise.resolve({ status: 'success' as const })),
}));

import { logPauseRitualDepthUpgraded as logDepthUpgradedDirect } from '@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade';
import {
  initialBriefIntegrateDoneFromRestored as integrateDoneDirect,
  initialBriefPauseStepFromRestored as briefStepDirect,
  initialSelectedBriefFaceFromRestored as briefFaceDirect,
} from '@/features/pause/application/use-cases/session/restored-brief-ritual-state';
import { initialRitualEntry as ritualEntryDirect } from '@/features/pause/application/use-cases/session/initial-ritual-entry';
import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  logPauseRitualDepthUpgraded,
} from '@/features/pause/application/use-cases/session/pause-session-brief-flow';
import { logPauseRitualDepthUpgraded as logDepthUpgradedMock } from '@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade';
import { supabasePauseRepository } from '@/features/pause/public-rpc';
import {
  briefPauseRepository,
  initialBriefIntegrateDoneFromRestored as integrateDoneFromBriefIo,
  initialBriefPauseStepFromRestored as briefStepFromBriefIo,
  initialRitualEntry as ritualEntryFromBriefIo,
  initialSelectedBriefFaceFromRestored as briefFaceFromBriefIo,
  pauseBriefRitualDepthUpgraded,
  pauseBriefRitualDepthUpgradedWithRepository,
} from './pause-session-brief-io';

/**
 * Presentation I/O parity (colocated beside `pause-session-brief-io.ts`).
 * Application mirror: `application/.../session/pause-session-brief-io-parity.test.ts` (colocated beside brief-flow).
 * Imports `pause-session-brief-flow` CI umbrella for `.toBe` identity pins only — production brief I/O keeps session + ritual/brief leaf imports.
 */
describe('pause-session-brief-io parity', () => {
  it('presentation I/O binds briefPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(briefPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O brief exports match pause-session-brief-flow CI umbrella', () => {
    expect(initialBriefPauseStepFromRestored).toBe(briefStepFromBriefIo);
    expect(initialBriefIntegrateDoneFromRestored).toBe(integrateDoneFromBriefIo);
    expect(initialSelectedBriefFaceFromRestored).toBe(briefFaceFromBriefIo);
    expect(initialRitualEntry).toBe(ritualEntryFromBriefIo);
  });

  it('session-brief-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(initialBriefPauseStepFromRestored).toBe(briefStepDirect);
    expect(initialBriefIntegrateDoneFromRestored).toBe(integrateDoneDirect);
    expect(initialSelectedBriefFaceFromRestored).toBe(briefFaceDirect);
    expect(initialRitualEntry).toBe(ritualEntryDirect);
    expect(logPauseRitualDepthUpgraded).toBe(logDepthUpgradedDirect);
  });

  it('pauseBriefRitualDepthUpgraded delegates to ritual-depth-upgrade leaf with default repository', async () => {
    await pauseBriefRitualDepthUpgraded('pi-brief-parity');

    expect(logDepthUpgradedMock).toHaveBeenCalledWith(
      briefPauseRepository,
      'pi-brief-parity',
    );
  });

  it('pauseBriefRitualDepthUpgradedWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected' } as unknown as typeof supabasePauseRepository;

    await pauseBriefRitualDepthUpgradedWithRepository(customRepo, 'pi-brief-custom');

    expect(logDepthUpgradedMock).toHaveBeenCalledWith(customRepo, 'pi-brief-custom');
  });
});
