/**
 * Reflect+decide flows presentation I/O (preflight, decide outcome RPC, outcome toasts).
 * Imports reflect/decide helpers from domain + ritual/decide leaf modules (score impacts
 * from `score-impacts` / `score-impact-presentation`; parity with `pause-reflect-mood-io`).
 * `PauseImpactData` via `pause-session-decide-io` (session decide beat).
 * Parity pins: `pause-reflect-flows-io.test.ts` (outcome wrapper distinctness + RPC delegation; ambience-io + pending-offer-io reciprocal inline pins),
 * `pause-reflect-flows-io-parity.test.ts`, `pause-reflect-flows-io-flow-sibling-parity.test.ts` ↔ `pause-reflect-flows-flow`,
 * `pause-reflect-flows-decide-io-sibling-parity.test.ts` ↔ `pause-session-decide-io` (application
 * `pause-reflect-flows-decide-flow-sibling-parity.test.ts` ↔ `pause-session-decide-flow`),
 * `pause-reflect-flows-steps-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io` (application
 * `pause-reflect-flows-steps-io-sibling-parity.test.ts` under `application/.../flows/`; reciprocal inline pins in
 * `pause-reflect-flows-io.test.ts` ↔ `pause-reflect-steps-io.test.ts`; application `pause-reflect-flows-io-parity.test.ts`
 * ↔ `pause-reflect-steps-io-parity.test.ts`),
 * `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io`,
 * `pause-reflect-flows-ambience-io-sibling-parity.test.ts` ↔ `pause-reflect-ambience-io`,
 * `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io`,
 * `pause-reflect-flows-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io` (application
 * `pause-reflect-flows-hub-io-sibling-parity.test.ts` under `application/.../flows/`),
 * `pause-reflect-flows-share-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`,
 * `pause-reflect-flows-generation-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`, and
 * `pause-reflect-flows-mood-io-sibling-parity.test.ts` ↔ `pause-reflect-mood-io`.
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

/** Default `PauseRepository` for reflect+decide presentation hooks. */
export const reflectPauseRepository = supabasePauseRepository;

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
  return runPauseOutcomeLog(reflectPauseRepository, input);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseReflectOutcomeLogWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; decision: string },
): ReturnType<typeof runPauseOutcomeLog> {
  return runPauseOutcomeLog(repository, input);
}
