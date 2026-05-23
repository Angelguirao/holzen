import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { logPauseRitualDepthUpgraded } from './ritual-depth-upgrade';

describe('logPauseRitualDepthUpgraded', () => {
  it('returns success when logStep succeeds', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    await expect(logPauseRitualDepthUpgraded(repository, 'pause-1')).resolves.toEqual({
      status: 'success',
    });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'pause-1',
      stepType: 'ritual_depth_upgraded',
      payload: { from: 'brief', to: 'deep' },
    });
  });

  it('returns sync_failed when logStep throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('rpc'));
    const repository = { logStep } as unknown as PauseRepository;

    await expect(logPauseRitualDepthUpgraded(repository, 'pause-1')).resolves.toEqual({
      status: 'sync_failed',
    });
  });
});
