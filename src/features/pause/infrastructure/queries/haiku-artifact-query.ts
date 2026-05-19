import { supabase } from '@/integrations/supabase/client';

/**
 * Reads persisted haiku for a pause instance (`pause_ai_artifacts.kind === 'haiku'`).
 * Used to lazy-hydrate ritual Reflect / Frame without depending on in-memory companion state.
 */
export async function fetchHaikuTextForPauseInstance(pauseInstanceId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('content')
    .eq('pause_instance_id', pauseInstanceId)
    .eq('kind', 'haiku')
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { content: unknown };
  const c = row.content as Record<string, unknown> | null;
  return typeof c?.haiku === 'string' ? (c.haiku as string).trim() || null : null;
}
