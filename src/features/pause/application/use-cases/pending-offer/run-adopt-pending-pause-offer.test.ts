import { describe, it, expect, vi } from 'vitest';
import { runAdoptPendingPauseOffer } from './run-adopt-pending-pause-offer';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

describe('runAdoptPendingPauseOffer', () => {
  it('returns ok when repository returns instance id', async () => {
    const repository = {
      adoptPendingOffer: vi.fn().mockResolvedValue({ ok: true, instance_id: 'inst-1' }),
    } as unknown as PauseRepository;

    await expect(runAdoptPendingPauseOffer(repository)).resolves.toEqual({
      status: 'ok',
      instanceId: 'inst-1',
    });
  });

  it('returns failed when repository response is incomplete', async () => {
    const repository = {
      adoptPendingOffer: vi.fn().mockResolvedValue({ ok: false }),
    } as unknown as PauseRepository;

    await expect(runAdoptPendingPauseOffer(repository)).resolves.toEqual({ status: 'failed' });
  });
});
