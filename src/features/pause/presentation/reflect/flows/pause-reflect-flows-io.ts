import { runPauseOutcomeLog } from '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

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
