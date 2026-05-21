import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import { buildOutcomeLoggedPayload } from '@/features/pause/application/use-cases/ritual/decide/outcome-log-payload';
import type { PauseState } from '@/features/pause/domain/pause-state';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** Retrospective `outcome_logged` for terminal expired/dismissed archive rows. */
export async function logRetrospectiveOutcome(
  repository: PauseRepository,
  params: { instanceId: string; outcome: string },
): Promise<PauseState | null> {
  return logPauseStep(repository, {
    instanceId: params.instanceId,
    stepType: 'outcome_logged',
    payload: buildOutcomeLoggedPayload(params.outcome),
  });
}
