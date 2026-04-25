import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FullviewCompanion = 'signal' | 'grounding' | 'history' | 'zoomOut';

/**
 * Fires a single `companion_fullview_opened` analytics event per
 * (user, pauseInstanceId, companion) mount.
 */
export function useFullviewTelemetry(
  companion: FullviewCompanion,
  pauseInstanceId: string | null | undefined,
) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pauseInstanceId) return;
    const key = `${companion}:${pauseInstanceId}`;
    if (firedRef.current === key) return;
    firedRef.current = key;

    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event: 'companion_fullview_opened',
          metadata: {
            companion,
            pause_instance_id: pauseInstanceId,
            ts: new Date().toISOString(),
          },
        });
      } catch {
        // observation only
      }
    })();
  }, [companion, pauseInstanceId]);
}
