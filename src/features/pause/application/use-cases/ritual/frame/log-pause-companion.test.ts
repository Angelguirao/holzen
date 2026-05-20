import { describe, expect, it, vi } from 'vitest';
import { logPauseCompanion } from './log-pause-companion';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

describe('logPauseCompanion', () => {
  it('delegates to repository.logCompanion', async () => {
    const logCompanion = vi.fn().mockResolvedValue({ ok: true, counts_for_pause: true });
    const repo = { logCompanion } as unknown as PauseRepository;
    const params = {
      instanceId: 'inst-1',
      companionType: 'haiku',
      action: 'complete' as const,
      entryPoint: 'pause_flow',
    };
    await expect(logPauseCompanion(repo, params)).resolves.toEqual({
      ok: true,
      counts_for_pause: true,
    });
    expect(logCompanion).toHaveBeenCalledWith(params);
  });
});
