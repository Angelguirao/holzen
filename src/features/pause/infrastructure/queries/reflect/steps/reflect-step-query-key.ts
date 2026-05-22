import type { PauseReflectStepType } from '@/features/pause/domain/reflect/steps/reflect-step-latest';
import { PAUSE_QUERY_PREFIX } from '@/features/pause/infrastructure/queries/pause-query-namespace';

export const PAUSE_REFLECT_STEP_QUERY_PREFIX = [...PAUSE_QUERY_PREFIX, 'reflect-step', 'latest'] as const;

export function pauseReflectStepLatestQueryKey(pauseInstanceId: string, stepType: PauseReflectStepType) {
  return [...PAUSE_REFLECT_STEP_QUERY_PREFIX, pauseInstanceId, stepType] as const;
}
