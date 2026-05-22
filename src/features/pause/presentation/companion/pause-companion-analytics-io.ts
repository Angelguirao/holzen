/**
 * Companion frame analytics presentation I/O (feedback vote + fullview opened).
 * Imports ritual/frame leaf modules directly (parity with orchestration/frame UI I/O peels).
 * Parity pins: `pause-companion-analytics-io.test.ts`, colocated `pause-companion-analytics-io-parity.test.ts`,
 * `pause-companion-analytics-io.re-exports.test.ts`,
 * `pause-companion-analytics-orchestration-io-sibling-parity.test.ts` ↔ `pause-companion-orchestration-io`,
 * `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts` ↔ `pause-companion-orchestrate-io`;
 * reciprocal inline pins: `pause-companion-analytics-io.test.ts` ↔ `pause-companion-orchestration-io.test.ts`,
 * `pause-companion-orchestrate-io.test.ts`.
 */
import type { PauseAnalyticsRepository } from '@/features/pause/ports/pause-analytics-repository';
import type {
  CompanionFullviewKind,
  LogCompanionFullviewOpenedInput,
} from '@/features/pause/application/use-cases/ritual/frame/log-companion-fullview-opened';
import type { LogCompanionFeedbackVoteInput } from '@/features/pause/application/use-cases/ritual/frame/log-companion-feedback-vote';
import { runLogCompanionFeedbackVote } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-fullview-opened';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

export type {
  CompanionFullviewKind,
  LogCompanionFeedbackVoteInput,
  LogCompanionFullviewOpenedInput,
};

export { runLogCompanionFeedbackVote, runLogCompanionFullviewOpened };

/** Default `PauseAnalyticsRepository` for companion frame presentation hooks. */
export const companionAnalyticsRepository = supabasePauseAnalyticsRepository;

/** Default port + use case: persist companion thumbs feedback. */
export function logCompanionFeedbackVote(
  input: LogCompanionFeedbackVoteInput,
): ReturnType<typeof runLogCompanionFeedbackVote> {
  return runLogCompanionFeedbackVote(companionAnalyticsRepository, input);
}

/** Default port + use case: persist companion fullview open. */
export function logCompanionFullviewOpened(
  input: LogCompanionFullviewOpenedInput,
): ReturnType<typeof runLogCompanionFullviewOpened> {
  return runLogCompanionFullviewOpened(companionAnalyticsRepository, input);
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
