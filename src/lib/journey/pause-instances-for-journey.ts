/**
 * Minimal pause_instances rows for Journey overview (streak + totals).
 * Does not use use-pause-stats-data / v_pause_full.
 */

import { supabase } from '@/integrations/supabase/client';

export type JourneyPauseRow = {
  state: string;
  completed_at: string | null;
  engaged_at: string | null;
  created_at: string;
};

export async function fetchPauseInstancesForJourney(userId: string): Promise<JourneyPauseRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - 365);
  const { data, error } = await supabase
    .from('pause_instances' as never)
    .select('state, completed_at, engaged_at, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as JourneyPauseRow[];
}
