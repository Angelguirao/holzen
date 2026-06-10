import { runPauseApplyCronCalmSweepForSelf } from '@/features/pause/application/use-cases/home/run-pause-apply-cron-calm-sweep-for-self';
import { runPauseEvaluateTransitionsForInstance } from '@/features/pause/application/use-cases/home/run-pause-evaluate-transitions-for-instance';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export { runPauseApplyCronCalmSweepForSelf } from '@/features/pause/application/use-cases/home/run-pause-apply-cron-calm-sweep-for-self';
export type { PauseApplyCronCalmSweepResult } from '@/features/pause/application/use-cases/home/run-pause-apply-cron-calm-sweep-for-self';
export { runPauseEvaluateTransitionsForInstance } from '@/features/pause/application/use-cases/home/run-pause-evaluate-transitions-for-instance';

export const pauseHomeCronRepository = supabasePauseRepository;

export function pauseApplyCronCalmSweepForSelf(
  input: { changePercent: number; direction: 'up' | 'down' },
): ReturnType<typeof runPauseApplyCronCalmSweepForSelf> {
  return runPauseApplyCronCalmSweepForSelf(pauseHomeCronRepository, input);
}

export function pauseEvaluateTransitionsForInstance(
  instanceId: string,
): ReturnType<typeof runPauseEvaluateTransitionsForInstance> {
  return runPauseEvaluateTransitionsForInstance(pauseHomeCronRepository, instanceId);
}

export function pauseEvaluateTransitionsForInstanceWithRepository(
  repository: PauseRepository,
  instanceId: string,
): ReturnType<typeof runPauseEvaluateTransitionsForInstance> {
  return runPauseEvaluateTransitionsForInstance(repository, instanceId);
}
