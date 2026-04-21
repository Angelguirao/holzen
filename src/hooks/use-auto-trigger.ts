import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

/**
 * Listens for server-side auto-triggered reflections via realtime subscription
 * on the profiles table (last_message changes).
 * Returns a flag + dismiss function for non-Home pages to show a banner.
 */
export function useAutoTrigger() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user) return;

    // Get initial message to establish baseline
    supabase
      .from('profiles')
      .select('last_message')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        lastMessageRef.current = data?.last_message ?? null;
        initializedRef.current = true;
      });

    const channel = supabase
      .channel(`auto-trigger-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!initializedRef.current) return;
          const newMessage = (payload.new as any)?.last_message;
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
  }, [user?.id]);

  const dismiss = useCallback(() => setPauseReady(false), []);

  return { pauseReady, dismiss };
}
