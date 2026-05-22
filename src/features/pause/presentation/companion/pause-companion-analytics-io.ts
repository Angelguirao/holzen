/**
 * Companion frame analytics presentation I/O (feedback vote + fullview opened).
 * Imports `run-log-companion-*` and input types via `pause-companion-analytics-flow` CI anchor
 * (parity with orchestration/orchestrate I/O peels).
 */
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
  type CompanionFullviewKind,
  type LogCompanionFeedbackVoteInput,
  type LogCompanionFullviewOpenedInput,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-analytics-flow';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

export type {
  CompanionFullviewKind,
  LogCompanionFeedbackVoteInput,
  LogCompanionFullviewOpenedInput,
};

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
