/**
 * Reflect+decide flows presentation I/O (preflight, decide outcome RPC, outcome toasts).
 * Imports reflect/decide helpers and `runPauseOutcomeLog` via `pause-reflect-flows-flow` CI anchor
 * (parity with hub/steps/share I/O flow anchors). `PauseImpactData` via `pause-session-decide-io`
 * (session decide beat — parity with reflect handler param types and `public-hooks`).
 */
import type { PauseImpactData } from '@/features/pause/presentation/session/pause-session-decide-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  parseScoreImpactVolatilityPct,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  runPauseOutcomeLog,
  scoreImpactMotionDelaySec,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
  type PauseScoreImpactRow,
  type PauseSessionReflectAndDecideViewInput,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  parseScoreImpactVolatilityPct,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
  type PauseImpactData,
  type PauseScoreImpactRow,
  type PauseSessionReflectAndDecideViewInput,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
};

/** Default port + use case: decide step `outcome_logged` RPC. */
export function pauseReflectOutcomeLog(
  input: { pauseInstanceId: string | null; decision: string },
): ReturnType<typeof runPauseOutcomeLog> {
  return runPauseOutcomeLog(supabasePauseRepository, input);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseReflectOutcomeLogWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; decision: string },
): ReturnType<typeof runPauseOutcomeLog> {
  return runPauseOutcomeLog(repository, input);
}
