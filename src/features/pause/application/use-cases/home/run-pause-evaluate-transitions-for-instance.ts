import { pauseEvaluateTransitions } from '@/features/pause/infrastructure/pause-rpc-client';
import type { PauseState } from '@/features/pause/domain/pause-state';

/** One-shot Home open_max expiry — server mirrors `pause_evaluate_transitions`. */
export async function runPauseEvaluateTransitionsForInstance(
  instanceId: string,
): Promise<PauseState | null> {
  return pauseEvaluateTransitions(instanceId);
}
