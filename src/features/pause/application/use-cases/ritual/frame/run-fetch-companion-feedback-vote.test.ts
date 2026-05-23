import { describe, expect, it, vi } from 'vitest';
import { runFetchCompanionFeedbackVote } from './run-fetch-companion-feedback-vote';
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

describe('runFetchCompanionFeedbackVote', () => {
  it('delegates to repository.fetchCompanionFeedbackVote', async () => {
    const fetchCompanionFeedbackVote = vi.fn().mockResolvedValue('down');
    const repository = { fetchCompanionFeedbackVote } as unknown as PauseAnalyticsRepository;
    const input = {
      userId: 'user-1',
      pauseInstanceId: 'inst-1',
      companionType: 'signal',
    };
    await expect(runFetchCompanionFeedbackVote(repository, input)).resolves.toBe('down');
    expect(fetchCompanionFeedbackVote).toHaveBeenCalledWith(input);
  });
});
