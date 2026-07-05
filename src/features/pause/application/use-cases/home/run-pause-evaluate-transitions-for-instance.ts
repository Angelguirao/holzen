import type { PauseState } from '@/features/pause/domain/pause-state';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';

/** One-shot Home open_max expiry — server mirrors `pause_evaluate_transitions`. */
export async function runPauseEvaluateTransitionsForInstance(
  repository: PauseRepository,
  instanceId: string,
): Promise<PauseState | null> {
  return repository.evaluateTransitions(instanceId);
}
