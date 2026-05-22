/**
 * Reflect+decide flows presentation I/O (preflight, decide outcome RPC, outcome toasts).
 * Imports reflect/decide helpers via flows subcluster anchors (parity with mood/steps I/O peels).
 * `PauseImpactData` via `pause-session-decide-io` (session decide beat).
 */
import type { PauseImpactData } from '@/features/pause/presentation/session/pause-session-decide-io';
import {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  type PauseScoreImpactRow,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from '@/features/pause/application/use-cases/ritual/decide/pause-decide-score-impacts-flow';
import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-decide-outcome-view-flow';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-and-decide-view-flow';
import { runPauseOutcomeLog } from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-log-flow';
import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-outcome-toast-flow';
import { getSessionQuote } from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-decide-wisdom-quotes-flow';
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
