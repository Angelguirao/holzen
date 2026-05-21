/**
 * CI cluster anchor for ritual reflect+decide flows presentation I/O (§3 / check:architecture-alignment).
 * Re-exports reflect preflight/post-generation and decide outcome helpers for a single presentation import surface.
 * Presentation: `pause-reflect-flows-io.ts` imports through this anchor.
 */
export {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from './pause-session-reflect-and-decide-flow';
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-flow';
export { runPauseOutcomeLog } from '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-toast-flow';
export { getSessionQuote } from '@/features/pause/application/use-cases/ritual/decide/wisdom-quotes';
