import { supabase } from '@/integrations/supabase/client';
import { PAUSE_QUERY_PREFIX } from '@/features/pause/application/queries/pause-query-namespace';

export const PAUSE_REFLECT_STEP_NOTE = 'note_updated' as const;
export const PAUSE_REFLECT_STEP_TAGS = 'tag_updated' as const;

export type PauseReflectStepType = typeof PAUSE_REFLECT_STEP_NOTE | typeof PAUSE_REFLECT_STEP_TAGS;

export const PAUSE_REFLECT_STEP_QUERY_PREFIX = [...PAUSE_QUERY_PREFIX, 'reflect-step', 'latest'] as const;

export function pauseReflectStepLatestQueryKey(pauseInstanceId: string, stepType: PauseReflectStepType) {
  return [...PAUSE_REFLECT_STEP_QUERY_PREFIX, pauseInstanceId, stepType] as const;
}

export type PauseReflectStepLatestRow = {
  payload: Record<string, unknown>;
  created_at: string;
};

export async function fetchLatestPauseReflectStep(
  pauseInstanceId: string,
  stepType: PauseReflectStepType,
): Promise<PauseReflectStepLatestRow | null> {
  const { data, error } = await supabase
    .from('pause_step_events' as never)
    .select('payload, created_at')
    .eq('pause_instance_id', pauseInstanceId)
    .eq('step_type', stepType)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const rows = (data ?? []) as PauseReflectStepLatestRow[];
  return rows[0] ?? null;
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
