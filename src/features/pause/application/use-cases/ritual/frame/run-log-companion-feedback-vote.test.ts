import { describe, expect, it, vi } from 'vitest';
import { runLogCompanionFeedbackVote } from './run-log-companion-feedback-vote';
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

describe('runLogCompanionFeedbackVote', () => {
  it('delegates to repository.insertEvent with companion_feedback metadata', async () => {
    const insertEvent = vi.fn().mockResolvedValue({ ok: true });
    const repository = { insertEvent } as unknown as PauseAnalyticsRepository;
    const input = {
      userId: 'user-1',
      companionType: 'signal',
      vote: 'up' as const,
      pauseInstanceId: 'inst-1',
      cacheId: 'cache-1',
    };
    await expect(runLogCompanionFeedbackVote(repository, input)).resolves.toEqual({ ok: true });
    expect(insertEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      event: 'companion_feedback',
      metadata: expect.objectContaining({
        companion_type: 'signal',
        vote: 'up',
        pause_instance_id: 'inst-1',
        cache_id: 'cache-1',
      }),
    });
  });
});
