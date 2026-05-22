import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/brief/ritual-depth-upgrade', () => ({
  logPauseRitualDepthUpgraded: vi.fn(),
}));

import { initialBriefPauseStepFromRestored as initialBriefPauseStepDirect } from '@/features/pause/application/use-cases/session/restored-brief-ritual-state';
import { initialBriefPauseStepFromRestored } from '@/features/pause/application/use-cases/session/pause-session-brief-flow';
import { initialBriefPauseStepFromRestored as initialBriefPauseStepFromBriefIo } from '@/features/pause/presentation/session/pause-session-brief-io';

describe('pause-session-brief-io parity', () => {
  it('presentation I/O brief exports match pause-session-brief-flow CI umbrella', () => {
    expect(initialBriefPauseStepFromRestored).toBe(initialBriefPauseStepFromBriefIo);
  });

  it('session-brief-flow CI umbrella composes the same leaf module as presentation I/O', () => {
    expect(initialBriefPauseStepFromRestored).toBe(initialBriefPauseStepDirect);
  });
});
