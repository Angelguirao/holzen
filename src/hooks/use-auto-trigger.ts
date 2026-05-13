import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { getProfileRowQueryOptions } from '@/lib/profile-row-query';

/**
 * Listens for server-side auto-triggered pause notifications via realtime subscription
 * on the profiles table (last_message changes).
 * Returns a flag + dismiss function for non-Home pages to show a banner.
 */
export function useAutoTrigger() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profileRow, status: profileStatus } = useQuery(getProfileRowQueryOptions(userId));

  const [pauseReady, setPauseReady] = useState(false);
  const lastMessageRef = useRef<string | null>(null);
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

  // Baseline last_message from the shared profiles query (same cache as useProfile).
  useEffect(() => {
    if (!userId) {
      lastMessageRef.current = null;
      initializedRef.current = false;
      return;
    }
    if (profileStatus !== 'success' && profileStatus !== 'error') {
      initializedRef.current = false;
      return;
    }
    lastMessageRef.current =
      profileStatus === 'success' ? (profileRow?.last_message ?? null) : null;
    initializedRef.current = true;
  }, [userId, profileStatus, profileRow?.last_message]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`auto-trigger-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!initializedRef.current) return;
          const row = payload.new as { last_message?: string | null };
          const newMessage = row?.last_message;
          if (newMessage && newMessage !== lastMessageRef.current) {
            lastMessageRef.current = newMessage;
            setPauseReady(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Depend only on user.id — the `user` object reference can change on token
    // refresh / re-emission and would otherwise tear down + resubscribe the channel.
  }, [userId]);

  /** Hide the non-Home banner only. Intentionally does **not** call `pause_dismiss_current` — same pattern as dismissing a toast (avoid accidental end-pause from Archive/Tools). */
  const dismiss = useCallback(() => setPauseReady(false), []);

  return { pauseReady, dismiss };
}
