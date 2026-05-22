import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade', () => ({
  logPauseRitualDepthUpgraded: vi.fn(),
}));

import { initialBriefPauseStepFromRestored as initialBriefPauseStepDirect } from '@/features/pause/application/use-cases/session/restored-brief-ritual-state';
import { initialRitualEntry as initialRitualEntryDirect } from '@/features/pause/application/use-cases/session/initial-ritual-entry';

import {
  initialBriefPauseStepFromRestored,
  initialRitualEntry,
} from './pause-session-brief-io';

describe('pause-session-brief-io re-exports', () => {
  it('re-exports brief hydration with identity binding to restored-brief-ritual-state leaf module', () => {
    expect(initialBriefPauseStepFromRestored).toBe(initialBriefPauseStepDirect);
  });

  it('re-exports initialRitualEntry with identity binding to initial-ritual-entry leaf module', () => {
    expect(initialRitualEntry).toBe(initialRitualEntryDirect);
  });
});
