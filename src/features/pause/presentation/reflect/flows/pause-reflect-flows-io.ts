import { runPauseOutcomeLog } from '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-log-flow';
import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-flow';
import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/decide/pause-decide-outcome-toast-flow';
import { getSessionQuote } from '@/features/pause/application/use-cases/ritual/decide/wisdom-quotes';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseSessionReflectAndDecideViewInput,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
  type PauseSessionReflectAndDecideViewInput,
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
