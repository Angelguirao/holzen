/**
 * CI cluster anchor for ritual reflect+decide flows presentation I/O (§3 / check:architecture-alignment).
 * Cluster markers: `ritual-reflect-flows-cluster.ts`, `ritual/decide/ritual-decide-cluster.ts` (empty exports; unit-tested).
 * Composes domain reflect/decide helpers + ritual/decide leaf modules (not subcluster flow anchors).
 * `pause-reflect-flows-io.re-exports.test.ts` and `pause-reflect-flows-io-parity.test.ts`
 * may import this umbrella for parity; production flows I/O keeps leaf imports.
 * Sibling pins: `pause-reflect-flows-flow.test.ts` ↔ `pause-reflect-generation-flow.test.ts`,
 * `pause-reflect-ambience-flow.test.ts`, and `pause-reflect-steps-flow.test.ts` (inline);
 * dedicated: `pause-reflect-flows-ambience-flow-sibling-parity.test.ts` ↔ `pause-reflect-ambience-flow`;
 * `pause-reflect-steps-flows-flow-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow`;
 * `pause-reflect-flows-pending-offer-flow-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-flow`;
 * `pause-reflect-flows-hub-flow-sibling-parity.test.ts` ↔ `pause-reflect-hub-flow`;
 * `pause-reflect-flows-generation-flow-sibling-parity.test.ts` ↔ `pause-reflect-generation-flow`;
 * `pause-reflect-flows-mood-flow-sibling-parity.test.ts` ↔ `pause-reflect-mood-flow`;
 * `pause-reflect-flows-decide-flow-sibling-parity.test.ts` ↔ `pause-session-decide-flow`;
 * `pause-reflect-flows-telemetry-flow-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-flow`;
 * `pause-reflect-flows-share-flow-sibling-parity.test.ts` ↔ `pause-reflect-share-flow`.
 * Outcome leaf vs presentation wrappers: flows umbrella re-exports `runPauseOutcomeLog` identity;
 * `pauseReflectOutcomeLog*` live on `pause-reflect-flows-io` only (pinned in flows-flow + flows-io-parity tests).
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
