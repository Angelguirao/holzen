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
