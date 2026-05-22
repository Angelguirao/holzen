import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
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
} from './pause-session-brief-io';

describe('pause-session-brief-io re-exports', () => {
  it('re-exports brief hydration with identity binding to session + ritual/brief leaf modules', () => {
    expect(initialBriefPauseStepFromRestored).toBe(briefStepDirect);
    expect(initialBriefIntegrateDoneFromRestored).toBe(integrateDoneDirect);
    expect(initialSelectedBriefFaceFromRestored).toBe(briefFaceDirect);
    expect(initialRitualEntry).toBe(ritualEntryDirect);
  });

  it('does not re-export logPauseRitualDepthUpgraded on presentation I/O (RPC via pauseBriefRitualDepthUpgraded)', () => {
    expect(logDepthUpgradedDirect).toBeTypeOf('function');
    expect(initialBriefPauseStepFromRestored).not.toBe(logDepthUpgradedDirect);
  });
});
