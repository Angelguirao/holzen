import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runToggleCompanionLibraryFavorite } from './run-toggle-companion-library-favorite';

describe('runToggleCompanionLibraryFavorite', () => {
  it('delegates to PauseRepository.toggleCompanionSlotFavorite', async () => {
    const toggleCompanionSlotFavorite = vi.fn().mockResolvedValue(true);
    const repository = { toggleCompanionSlotFavorite } as unknown as PauseRepository;
    const onBucketComputed = vi.fn();

    await expect(
      runToggleCompanionLibraryFavorite(repository, {
        pauseInstanceId: 'pause-1',
        sourceType: 'signal',
        onBucketComputed,
      }),
    ).resolves.toBe(true);

    expect(toggleCompanionSlotFavorite).toHaveBeenCalledWith({
      pauseInstanceId: 'pause-1',
      sourceType: 'signal',
      onBucketComputed,
    });
  });
});
