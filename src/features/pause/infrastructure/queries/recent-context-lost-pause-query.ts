import { supabase } from '@/integrations/supabase/client';

const CONTEXT_LOST_WINDOW_MS = 24 * 60 * 60 * 1000;

export type RecentContextLostPause = {
  expiredAt: string;
  pauseInstanceId: string;
};

/**
 * Latest cron `context_lost` expiry within 24h — Home calm-waters copy.
 * Returns null when none or user still has an open pause (caller should gate).
 */
export async function fetchRecentContextLostPause(
  userId: string,
  nowMs: number = Date.now(),
): Promise<RecentContextLostPause | null> {
  const since = new Date(nowMs - CONTEXT_LOST_WINDOW_MS).toISOString();

  const { data, error } = await supabase
    .from('pause_instances' as never)
    .select('id, terminal_at, created_at')
    .eq('user_id', userId)
    .eq('state', 'expired')
    .eq('expired_reason', 'context_lost')
    .eq('source', 'cron_volatility')
    .gte('terminal_at', since)
    .order('terminal_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    id: string;
    terminal_at: string | null;
    updated_at: string | null;
    created_at: string;
  };

  const expiredAt = row.terminal_at ?? row.updated_at ?? row.created_at;
  return { expiredAt, pauseInstanceId: row.id };
}

export const CONTEXT_LOST_HOME_WINDOW_MS = CONTEXT_LOST_WINDOW_MS;
