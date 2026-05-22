/**
 * CI cluster anchor for ritual reflect+decide flows presentation I/O (§3 / check:architecture-alignment).
 * Composes reflect/decide subcluster anchors; presentation imports via `pause-reflect-flows-io.ts`.
 */
export {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from './pause-reflect-and-decide-view-flow';
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from './pause-decide-outcome-view-flow';
export type { PauseImpactData } from './pause-decide-outcome-view-flow';
export { runPauseOutcomeLog } from '../../decide/pause-decide-outcome-log-flow';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-reflect-decide-outcome-toast-flow';
export { getSessionQuote } from './pause-reflect-decide-wisdom-quotes-flow';
export {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  type PauseScoreImpactRow,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from '../../decide/pause-decide-score-impacts-flow';
