import { describe, expect, it, vi } from 'vitest';
import { runPauseDismissCurrent } from './run-pause-dismiss-current';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

describe('runPauseDismissCurrent', () => {
  it('delegates to repository.dismissCurrent', async () => {
    const dismissCurrent = vi.fn().mockResolvedValue('completed');
    const repo = { dismissCurrent } as unknown as PauseRepository;
    await expect(runPauseDismissCurrent(repo)).resolves.toBe('completed');
    expect(dismissCurrent).toHaveBeenCalledOnce();
  });
});
