/**
 * CI cluster anchor for ritual reflect+decide flows presentation I/O (§3 / check:architecture-alignment).
 * Re-exports reflect preflight/post-generation and decide outcome helpers for application-layer imports.
 * Presentation: `pause-reflect-flows-io.ts` imports through this anchor (off deep domain/decide paths).
 */
export {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/domain/decide/pause-decide-outcome-flow';
export { runPauseOutcomeLog } from '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/decide/outcome-toast';
export { getSessionQuote } from '@/features/pause/application/use-cases/ritual/decide/wisdom-quotes';
