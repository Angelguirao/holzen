import { describe, it, expect, vi } from 'vitest';
import { runDeclinePendingPauseOffer } from './run-decline-pending-pause-offer';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

describe('runDeclinePendingPauseOffer', () => {
  it('returns ok when repository succeeds', async () => {
    const repository = {
      declinePendingOffer: vi.fn().mockResolvedValue({ ok: true, cleared: 1 }),
    } as unknown as PauseRepository;

    await expect(runDeclinePendingPauseOffer(repository)).resolves.toEqual({ status: 'ok' });
  });

  it('returns failed when repository throws', async () => {
    const repository = {
      declinePendingOffer: vi.fn().mockRejectedValue(new Error('network')),
    } as unknown as PauseRepository;

    await expect(runDeclinePendingPauseOffer(repository)).resolves.toEqual({ status: 'failed' });
  });
});
