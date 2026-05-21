import { supabase } from '@/integrations/supabase/client';
import type {
  PauseReflectStepLatestRow,
  PauseReflectStepType,
} from '@/features/pause/domain/reflect-step-latest';

/** Supabase read for latest reflect note/tags step event — used by `ReflectGenerator` adapter. */
export async function fetchLatestPauseReflectStepFromSupabase(
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
