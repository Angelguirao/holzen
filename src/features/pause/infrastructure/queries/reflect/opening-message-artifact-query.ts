import { supabase } from '@/integrations/supabase/client';

/**
 * Reads persisted reflect-step copy (`pause_ai_artifacts.kind === 'reflection_text'`).
 * Used to lazy-hydrate ritual Reflect without depending on in-memory companion state.
 */
export async function fetchOpeningMessageForPauseInstance(pauseInstanceId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('content')
    .eq('pause_instance_id', pauseInstanceId)
    .eq('kind', 'reflection_text')
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { content: unknown };
  const c = row.content as Record<string, unknown> | null;
  return typeof c?.message === 'string' ? (c.message as string).trim() || null : null;
}
