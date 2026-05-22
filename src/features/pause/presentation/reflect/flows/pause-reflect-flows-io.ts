/**
 * Reflect+decide flows presentation I/O (preflight, decide outcome RPC, outcome toasts).
 * Imports reflect/decide helpers from domain + ritual/decide leaf modules (score impacts
 * from `score-impacts` / `score-impact-presentation`; parity with `pause-reflect-mood-io`).
 * `PauseImpactData` via `pause-session-decide-io` (session decide beat).
 */
import type { PauseImpactData } from '@/features/pause/presentation/session/pause-session-decide-io';
import {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
  type PauseScoreImpactRow,
} from '@/features/pause/application/use-cases/ritual/decide/score-impacts';
import {
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  type ScoreImpactVariant,
  type ScoreImpactViewMode,
} from '@/features/pause/application/use-cases/ritual/decide/score-impact-presentation';
import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/domain/decide/pause-decide-outcome-flow';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';
import { runPauseOutcomeLog } from '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log';
import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/decide/outcome-toast';
import { getSessionQuote } from '@/features/pause/application/use-cases/ritual/decide/wisdom-quotes';
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
