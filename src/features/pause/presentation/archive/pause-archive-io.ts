import { logRetrospectiveOutcome } from '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome';
import { trackPauseOutcomeRetrospective } from '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export { trackPauseOutcomeRetrospective };
export type { PauseOutcomeRetrospectiveSurface } from '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry';

/** Default port + use case: archive retrospective `outcome_logged` RPC. */
export function pauseArchiveLogRetrospectiveOutcome(
  params: { instanceId: string; outcome: string },
): ReturnType<typeof logRetrospectiveOutcome> {
  return logRetrospectiveOutcome(supabasePauseRepository, params);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseArchiveLogRetrospectiveOutcomeWithRepository(
  repository: PauseRepository,
  params: { instanceId: string; outcome: string },
): ReturnType<typeof logRetrospectiveOutcome> {
  return logRetrospectiveOutcome(repository, params);
}
