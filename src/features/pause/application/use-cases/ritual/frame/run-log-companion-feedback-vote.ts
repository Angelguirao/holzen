import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import {
  buildCompanionFeedbackVoteMetadata,
  type LogCompanionFeedbackVoteInput,
} from './log-companion-feedback-vote';

/** Persist companion thumbs feedback via `analytics_events` (port-backed). */
export async function runLogCompanionFeedbackVote(
  repository: PauseAnalyticsRepository,
  input: LogCompanionFeedbackVoteInput,
): Promise<{ ok: boolean }> {
  return repository.insertEvent({
    userId: input.userId,
    event: 'companion_feedback',
    metadata: buildCompanionFeedbackVoteMetadata(input),
  });
}
