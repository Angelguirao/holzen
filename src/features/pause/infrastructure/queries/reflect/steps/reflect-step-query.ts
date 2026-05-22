import {
  noteTextFromReflectRow,
  PAUSE_REFLECT_STEP_NOTE,
  PAUSE_REFLECT_STEP_TAGS,
  tagsFromReflectRow,
  type PauseReflectStepLatestRow,
  type PauseReflectStepType,
} from '@/features/pause/domain/reflect/steps/reflect-step-latest';
import { fetchLatestPauseReflectStepFromSupabase } from '@/features/pause/infrastructure/queries/reflect/steps/fetch-latest-pause-reflect-step';
import {
  PAUSE_REFLECT_STEP_QUERY_PREFIX,
  pauseReflectStepLatestQueryKey,
} from './reflect-step-query-key';

export {
  PAUSE_REFLECT_STEP_QUERY_PREFIX,
  pauseReflectStepLatestQueryKey,
} from './reflect-step-query-key';

export async function fetchLatestPauseReflectStep(
  pauseInstanceId: string,
  stepType: PauseReflectStepType,
): Promise<PauseReflectStepLatestRow | null> {
  return fetchLatestPauseReflectStepFromSupabase(pauseInstanceId, stepType);
}

export function getLatestPauseReflectNoteQueryOptions(pauseInstanceId: string) {
  return {
    queryKey: pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_NOTE),
    queryFn: () => fetchLatestPauseReflectStep(pauseInstanceId, PAUSE_REFLECT_STEP_NOTE),
    select: (row: PauseReflectStepLatestRow | null) => noteTextFromReflectRow(row),
    enabled: Boolean(pauseInstanceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export function getLatestPauseReflectTagsQueryOptions(pauseInstanceId: string) {
  return {
    queryKey: pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_TAGS),
    queryFn: () => fetchLatestPauseReflectStep(pauseInstanceId, PAUSE_REFLECT_STEP_TAGS),
    select: (row: PauseReflectStepLatestRow | null) => tagsFromReflectRow(row),
    enabled: Boolean(pauseInstanceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
