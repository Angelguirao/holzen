import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runPauseFavoriteToggle } from './run-pause-favorite-toggle';

describe('runPauseFavoriteToggle', () => {
  it('returns no_instance without RPC', async () => {
    const repository = { logStep: vi.fn() } as unknown as PauseRepository;
    expect(
      await runPauseFavoriteToggle(repository, { pauseInstanceId: null, isFavorite: false }),
    ).toEqual({ status: 'no_instance' });
    expect(repository.logStep).not.toHaveBeenCalled();
  });

  it('logs favorite_toggled with new value', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseFavoriteToggle(repository, {
      pauseInstanceId: 'inst-1',
      isFavorite: false,
    });

    expect(result).toEqual({ status: 'success', newValue: true });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'favorite_toggled',
      payload: { is_favorite: true },
    });
  });

  it('returns sync_failed on RPC error', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseFavoriteToggle(repository, {
      pauseInstanceId: 'inst-1',
      isFavorite: true,
    });

    expect(result).toEqual({ status: 'sync_failed', attemptedValue: false });
  });
});
