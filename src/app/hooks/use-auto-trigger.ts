import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import {
  getProfileRowQueryOptions,
  subscribeProfileLastContextUpdates,
} from '@/features/user/public-queries';
import { supabase } from '@/integrations/supabase/client';

type PauseInstanceRealtimeRow = {
  state?: string | null;
};

function isOpenPauseRow(row: PauseInstanceRealtimeRow | undefined): boolean {
  return row?.state === 'active' || row?.state === 'engaged';
}

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

  // Check URL for ?pause=ready (from push notification deep-link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pause') === 'ready') {
      setPauseReady(true);
      // Clean the URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('pause');
      window.history.replaceState({}, '', url.pathname + url.search);
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

    const channel = supabase
      .channel(`auto-trigger-pause-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pause_instances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!initializedRef.current) return;
          const row = payload.new as PauseInstanceRealtimeRow;
          if (isOpenPauseRow(row)) setPauseReady(true);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pause_instances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!initializedRef.current) return;
          const row = payload.new as PauseInstanceRealtimeRow;
          const oldRow = payload.old as PauseInstanceRealtimeRow;
          if (isOpenPauseRow(row) && !isOpenPauseRow(oldRow)) {
            setPauseReady(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /** Hide the non-Home banner only. Intentionally does **not** call `pause_dismiss_current` — same pattern as dismissing a toast (avoid accidental end-pause from Archive/Tools). */
  const dismiss = useCallback(() => setPauseReady(false), []);

  return { pauseReady, dismiss };
}
