import {
  PAUSE_REFLECT_STEP_NOTE,
  PAUSE_REFLECT_STEP_TAGS,
  type PauseReflectStepLatestRow,
  type PauseReflectStepType,
} from '@/features/pause/domain/reflect-step-latest';
import { supabaseReflectGenerator } from '@/features/pause/infrastructure/supabase-reflect-generator';
import { PAUSE_QUERY_PREFIX } from '@/features/pause/application/queries/pause-query-namespace';

export {
  PAUSE_REFLECT_STEP_NOTE,
  PAUSE_REFLECT_STEP_TAGS,
  type PauseReflectStepLatestRow,
  type PauseReflectStepType,
};

export const PAUSE_REFLECT_STEP_QUERY_PREFIX = [...PAUSE_QUERY_PREFIX, 'reflect-step', 'latest'] as const;

export function pauseReflectStepLatestQueryKey(pauseInstanceId: string, stepType: PauseReflectStepType) {
  return [...PAUSE_REFLECT_STEP_QUERY_PREFIX, pauseInstanceId, stepType] as const;
}

export async function fetchLatestPauseReflectStep(
  pauseInstanceId: string,
  stepType: PauseReflectStepType,
): Promise<PauseReflectStepLatestRow | null> {
  return supabaseReflectGenerator.fetchLatestReflectStep(pauseInstanceId, stepType);
}

export function noteTextFromReflectRow(row: PauseReflectStepLatestRow | null | undefined): string {
  const text = row?.payload?.text;
  return typeof text === 'string' ? text : '';
}

export function tagsFromReflectRow(row: PauseReflectStepLatestRow | null | undefined): string[] {
  const arr = row?.payload?.tags;
  return Array.isArray(arr) ? (arr as string[]).slice() : [];
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
