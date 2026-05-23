import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';

export type FetchCompanionFeedbackVoteInput = {
  userId: string;
  pauseInstanceId: string;
  companionType: string;
};

/** Read persisted companion thumbs vote via `PauseAnalyticsRepository`. */
export async function runFetchCompanionFeedbackVote(
  repository: PauseAnalyticsRepository,
  input: FetchCompanionFeedbackVoteInput,
): Promise<'up' | 'down' | null> {
  return repository.fetchCompanionFeedbackVote(input);
}
