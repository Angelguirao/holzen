import { supabase } from '@/integrations/supabase/client';

/** `v_pause_full` row shape for Settings → Export (RLS-scoped by `user_id`). */
export type SettingsExportPauseRow = Record<string, unknown>;

export type SettingsExportStepEvent = {
  pause_instance_id: string;
  step_type: string;
  payload: unknown;
  created_at: string;
};

export type SettingsExportCompanionEvent = {
  pause_instance_id: string;
  companion_type: string;
  action: string;
  counts_for_pause: boolean | null;
  non_counting_reason: string | null;
  entry_point: string | null;
  created_at: string;
};

export type SettingsExportAiArtifact = {
  pause_instance_id: string;
  kind: string;
  content: unknown;
  created_at: string;
};

export type SettingsDataExportBundle = {
  pauses: SettingsExportPauseRow[];
  stepEvents: SettingsExportStepEvent[];
  companionEvents: SettingsExportCompanionEvent[];
  aiArtifacts: SettingsExportAiArtifact[];
};

/** Pause-first user data export (Settings JSON/CSV). Profile row fetched separately via user queries. */
export async function fetchSettingsDataExportBundle(userId: string): Promise<SettingsDataExportBundle> {
  const [
    { data: pauses },
    { data: stepEvents },
    { data: companionEvents },
    { data: artifacts },
  ] = await Promise.all([
    supabase
      .from('v_pause_full' as never)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('pause_step_events' as never)
      .select('pause_instance_id, step_type, payload, created_at')
      .eq('user_id', userId),
    supabase
      .from('pause_companion_events' as never)
      .select(
        'pause_instance_id, companion_type, action, counts_for_pause, non_counting_reason, entry_point, created_at',
      )
      .eq('user_id', userId),
    supabase
      .from('pause_ai_artifacts' as never)
      .select('pause_instance_id, kind, content, created_at')
      .eq('user_id', userId),
  ]);

  return {
    pauses: (pauses ?? []) as SettingsExportPauseRow[],
    stepEvents: (stepEvents ?? []) as SettingsExportStepEvent[],
    companionEvents: (companionEvents ?? []) as SettingsExportCompanionEvent[],
    aiArtifacts: (artifacts ?? []) as SettingsExportAiArtifact[],
  };
}
