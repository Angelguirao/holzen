import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type CompanionFullviewKind = 'signal' | 'grounding' | 'history' | 'zoomOut';

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

export async function logCompanionFullviewOpened(input: {
  userId: string;
  companion: CompanionFullviewKind;
  pauseInstanceId: string;
}): Promise<void> {
  await insertPauseAnalyticsEvent({
    userId: input.userId,
    event: 'companion_fullview_opened',
    metadata: {
      companion: input.companion,
      pause_instance_id: input.pauseInstanceId,
      ts: new Date().toISOString(),
    },
  });
}

/** Persists admin rapid-testing toggle for cross-device dev-mode hydration. */
export async function logDevModeSetting(userId: string, enabled: boolean): Promise<void> {
  await insertPauseAnalyticsEvent({
    userId,
    event: 'dev_mode_setting',
    metadata: { enabled },
  });
}
