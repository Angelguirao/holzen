import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export async function insertPauseAnalyticsEvent(params: {
  userId: string;
  event: string;
  metadata: Record<string, unknown>;
}): Promise<{ ok: boolean }> {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      user_id: params.userId,
      event: params.event,
      metadata: params.metadata as Json,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

function voteFromCompanionFeedbackMetadata(metadata: Json | null | undefined): 'up' | 'down' | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const v = (metadata as Record<string, unknown>).vote;
  return v === 'up' || v === 'down' ? v : null;
}

/** Latest companion thumbs vote for a pause instance + companion type (read path for TanStack Query). */
/** Latest admin dev-mode toggle from `analytics_events`; `null` when none or on error. */
export async function fetchDevModeSettingFromAnalytics(userId: string): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('metadata')
      .eq('user_id', userId)
      .eq('event', 'dev_mode_setting')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data?.length) return null;
    const metadata = data[0].metadata as { enabled?: boolean } | null;
    return metadata?.enabled === true;
  } catch {
    return null;
  }
}

export async function fetchCompanionFeedbackVoteFromAnalytics(params: {
  userId: string;
  pauseInstanceId: string;
  companionType: string;
}): Promise<'up' | 'down' | null> {
  try {
    const { data } = await supabase
      .from('analytics_events')
      .select('metadata')
      .eq('user_id', params.userId)
      .eq('event', 'companion_feedback')
      .filter('metadata->>pause_instance_id', 'eq', params.pauseInstanceId)
      .filter('metadata->>companion_type', 'eq', params.companionType)
      .limit(1);
    if (!data || data.length === 0) return null;
    return voteFromCompanionFeedbackMetadata(data[0].metadata);
  } catch {
    return null;
  }
}
