import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FullviewCompanion = 'signal' | 'grounding' | 'history' | 'zoomOut';

/**
 * Fires a single `companion_fullview_opened` analytics event per
 * (user, reflectionId, companion) mount. Used to measure adoption of the
 * Full View surfaces independently of the inline card telemetry.
 *
 * Deliberately best-effort: errors are swallowed because this is an
 * observation hook, never a gate. The `once` ref prevents double-fires
 * under React 18 StrictMode.
 */
export function useFullviewTelemetry(
  companion: FullviewCompanion,
  reflectionId: string | null | undefined,
) {
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!reflectionId) return;
    const key = `${companion}:${reflectionId}`;
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
            reflection_id: reflectionId,
            ts: new Date().toISOString(),
          },
        });
      } catch {
        // observation only
      }
    })();
  }, [companion, reflectionId]);
}
