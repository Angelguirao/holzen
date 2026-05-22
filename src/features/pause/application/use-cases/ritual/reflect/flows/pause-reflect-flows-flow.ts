/**
 * CI cluster anchor for ritual reflect+decide flows presentation I/O (§3 / check:architecture-alignment).
 * Composes domain reflect/decide helpers + ritual/decide leaf modules (not subcluster flow anchors).
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
export type { PauseImpactData } from '../../decide/impact-data';
export { runPauseOutcomeLog } from '../../decide/run-pause-outcome-log';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '../../decide/outcome-toast';
export { getSessionQuote } from '../../decide/wisdom-quotes';
export {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
  type PauseScoreImpactRow,
} from '../../decide/score-impacts';
export {
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from '../../decide/score-impact-presentation';
