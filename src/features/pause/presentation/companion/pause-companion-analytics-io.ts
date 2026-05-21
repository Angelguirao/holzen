import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import type { LogCompanionFeedbackVoteInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-feedback-vote';
import { runLogCompanionFeedbackVote } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote';
import type { LogCompanionFullviewOpenedInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-fullview-opened';
import { runLogCompanionFullviewOpened } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-fullview-opened';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

export type { CompanionFullviewKind, LogCompanionFullviewOpenedInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-fullview-opened';
export type { LogCompanionFeedbackVoteInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-feedback-vote';

/** Default port + use case: persist companion thumbs feedback. */
export function logCompanionFeedbackVote(
  input: LogCompanionFeedbackVoteInput,
): ReturnType<typeof runLogCompanionFeedbackVote> {
  return runLogCompanionFeedbackVote(supabasePauseAnalyticsRepository, input);
}

/** Default port + use case: persist companion fullview open. */
export function logCompanionFullviewOpened(
  input: LogCompanionFullviewOpenedInput,
): ReturnType<typeof runLogCompanionFullviewOpened> {
  return runLogCompanionFullviewOpened(supabasePauseAnalyticsRepository, input);
}

/** Test seam: inject a custom `PauseAnalyticsRepository`. */
export function logCompanionFeedbackVoteWithRepository(
  repository: PauseAnalyticsRepository,
  input: LogCompanionFeedbackVoteInput,
): ReturnType<typeof runLogCompanionFeedbackVote> {
  return runLogCompanionFeedbackVote(repository, input);
}

export function logCompanionFullviewOpenedWithRepository(
  repository: PauseAnalyticsRepository,
  input: LogCompanionFullviewOpenedInput,
): ReturnType<typeof runLogCompanionFullviewOpened> {
  return runLogCompanionFullviewOpened(repository, input);
}
