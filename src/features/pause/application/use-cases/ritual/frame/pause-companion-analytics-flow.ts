/**
 * CI cluster anchor for companion frame analytics presentation I/O (§3 / check:architecture-alignment).
 * Feedback vote + fullview opened use cases live in sibling `ritual/frame/*` modules.
 * Presentation: `pause-companion-analytics-io.ts` imports through this anchor.
 */
export type {
  CompanionFullviewKind,
  LogCompanionFullviewOpenedInput,
} from './log-companion-fullview-opened';
export type { LogCompanionFeedbackVoteInput } from './log-companion-feedback-vote';
export { runLogCompanionFeedbackVote } from './run-log-companion-feedback-vote';
export { runLogCompanionFullviewOpened } from './run-log-companion-fullview-opened';
