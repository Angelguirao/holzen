/**
 * CI cluster anchor for ritual reflect+decide flows presentation I/O (§3 / check:architecture-alignment).
 * Cluster markers: `ritual-reflect-flows-cluster.ts`, `ritual/decide/ritual-decide-cluster.ts` (empty exports; unit-tested).
 * Composes domain reflect/decide helpers + ritual/decide leaf modules (not subcluster flow anchors).
 * `pause-reflect-flows-io.re-exports.test.ts` and `pause-reflect-flows-io-parity.test.ts`
 * may import this umbrella for parity; production flows I/O keeps leaf imports.
 * Sibling pin: `pause-reflect-flows-flow.test.ts` ↔ `pause-reflect-generation-flow.test.ts`.
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
