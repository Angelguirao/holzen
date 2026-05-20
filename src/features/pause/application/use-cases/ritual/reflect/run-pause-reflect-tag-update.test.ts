import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runPauseReflectTagUpdate } from './run-pause-reflect-tag-update';

describe('runPauseReflectTagUpdate', () => {
  it('logs tag_updated payload', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseReflectTagUpdate(repository, {
      pauseInstanceId: 'inst-1',
      tags: ['fomo', 'calm'],
    });

    expect(result).toEqual({ status: 'success' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'tag_updated',
      payload: { tags: ['fomo', 'calm'] },
    });
  });
});
