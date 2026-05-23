import { describe, expect, it, vi } from 'vitest';
import { logPauseStep } from './log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

describe('logPauseStep', () => {
  it('delegates to repository.logStep', async () => {
    const logStep = vi.fn().mockResolvedValue('engaged');
    const repo = { logStep } as unknown as PauseRepository;
    const params = {
      instanceId: 'inst-1',
      stepType: 'breath_completed' as const,
      payload: { breath_segment: 1 },
    };
    await expect(logPauseStep(repo, params)).resolves.toBe('engaged');
    expect(logStep).toHaveBeenCalledWith(params);
  });
});
