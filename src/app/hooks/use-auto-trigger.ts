import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { subscribePauseInstanceOpenUpdates } from '@/features/pause/public-queries';
import {
  getProfileRowQueryOptions,
  subscribeProfileLastContextUpdates,
} from '@/features/user/public-queries';

/**
 * Listens for server-side auto-triggered pause notifications.
 * Primary path: `pause_instances` Realtime (cron/manual lifecycle).
 * Legacy fallback: `profiles.last_context` when that table is still on the publication.
 */
export function useAutoTrigger() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profileRow, status: profileStatus } = useQuery(getProfileRowQueryOptions(userId));

  const [pauseReady, setPauseReady] = useState(false);
  const lastContextRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Banner-only deep links (`/?pause=ready` without instance id) — instance navigation is
  // handled by `usePauseReadyDeepLink` in `AppLayout`.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pause') === 'ready' && !params.get('pauseInstanceId')?.trim()) {
      setPauseReady(true);
    }
  }, []);

  // Baseline last_context from the shared profiles query (same cache as useProfile).
  useEffect(() => {
    if (!userId) {
      lastContextRef.current = null;
      initializedRef.current = false;
      return;
    }
    if (profileStatus !== 'success' && profileStatus !== 'error') {
      initializedRef.current = false;
      return;
    }
    lastContextRef.current =
      profileStatus === 'success' ? (profileRow?.last_context ?? null) : null;
    initializedRef.current = true;
  }, [userId, profileStatus, profileRow?.last_context]);

  useEffect(() => {
    if (!userId) return;

    return subscribeProfileLastContextUpdates(userId, `auto-trigger-${userId}`, (newContext) => {
      if (!initializedRef.current) return;
      if (newContext && newContext !== lastContextRef.current) {
        lastContextRef.current = newContext;
        setPauseReady(true);
      }
    });
    // Depend only on user.id — the `user` object reference can change on token
    // refresh / re-emission and would otherwise tear down + resubscribe the channel.
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    return subscribePauseInstanceOpenUpdates(userId, `auto-trigger-pause-${userId}`, () => {
      if (!initializedRef.current) return;
      setPauseReady(true);
    });
  }, [userId]);

  /** Hide the non-Home banner only. Intentionally does **not** call `pause_dismiss_current` — same pattern as dismissing a toast (avoid accidental end-pause from Archive/Tools). */
  const dismiss = useCallback(() => setPauseReady(false), []);

  return { pauseReady, dismiss, setPauseReady };
}
