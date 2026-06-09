import { supabase } from '@/integrations/supabase/client';

export const pauseInstancePracticeXpQueryKey = (pauseInstanceId: string | null | undefined) =>
  ['pause-instance-practice-xp', pauseInstanceId] as const;

/** Server-authoritative Presence XP for a completed pause (`practice_xp_awarded`). */
export async function fetchPauseInstancePracticeXpAwarded(
  pauseInstanceId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('pause_instances')
    .select('practice_xp_awarded')
    .eq('id', pauseInstanceId)
    .maybeSingle();

  if (error) throw error;

  const row = data as { practice_xp_awarded?: number | null } | null;
  const xp = row?.practice_xp_awarded;
  if (typeof xp === 'number' && Number.isFinite(xp)) return Math.max(0, Math.floor(xp));
  return null;
}
