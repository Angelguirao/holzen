import { logRetrospectiveOutcome } from '@/features/pause/application/use-cases/ritual/decide/log-retrospective-outcome';
import {
  trackPauseOutcomeRetrospective,
  type PauseOutcomeRetrospectiveSurface,
} from '@/features/pause/application/use-cases/ritual/decide/pause-outcome-retrospective-telemetry';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export { trackPauseOutcomeRetrospective };
export type { PauseOutcomeRetrospectiveSurface };

/** Default `PauseRepository` for archive retrospective presentation hooks. */
export const archivePauseRepository = supabasePauseRepository;

/** Default port + use case: archive retrospective `outcome_logged` RPC. */
export function pauseArchiveLogRetrospectiveOutcome(
  params: { instanceId: string; outcome: string },
): ReturnType<typeof logRetrospectiveOutcome> {
  return logRetrospectiveOutcome(archivePauseRepository, params);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseArchiveLogRetrospectiveOutcomeWithRepository(
  repository: PauseRepository,
  params: { instanceId: string; outcome: string },
): ReturnType<typeof logRetrospectiveOutcome> {
  return logRetrospectiveOutcome(repository, params);
}
