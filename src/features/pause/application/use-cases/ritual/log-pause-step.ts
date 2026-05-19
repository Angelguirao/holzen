import type { PauseState, PauseStepType } from '@/features/pause/domain/pause-state';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** Application use case: persist a ritual step via `pause_log_step` (port-backed). */
export async function logPauseStep(
  repository: PauseRepository,
  params: {
    instanceId: string;
    stepType: PauseStepType;
    payload?: Record<string, unknown>;
  },
): Promise<PauseState | null> {
  return repository.logStep(params);
}
