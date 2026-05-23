/** Latest `pause_step_events` row for reflect post-it note / tags hydration. */
export const PAUSE_REFLECT_STEP_NOTE = 'note_updated' as const;
export const PAUSE_REFLECT_STEP_TAGS = 'tag_updated' as const;

export type PauseReflectStepType = typeof PAUSE_REFLECT_STEP_NOTE | typeof PAUSE_REFLECT_STEP_TAGS;

export type PauseReflectStepLatestRow = {
  payload: Record<string, unknown>;
  created_at: string;
};

export function noteTextFromReflectRow(row: PauseReflectStepLatestRow | null | undefined): string {
  const text = row?.payload?.text;
  return typeof text === 'string' ? text : '';
}

export function tagsFromReflectRow(row: PauseReflectStepLatestRow | null | undefined): string[] {
  const arr = row?.payload?.tags;
  return Array.isArray(arr) ? (arr as string[]).slice() : [];
}
