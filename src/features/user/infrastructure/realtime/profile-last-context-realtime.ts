import { supabase } from '@/integrations/supabase/client';

export type ProfileLastContextRow = {
  last_context?: string | null;
};

/** Realtime `profiles.last_context` updates (cron auto-pause / push deep-link companion). */
export function subscribeProfileLastContextUpdates(
  userId: string,
  channelName: string,
  onUpdate: (lastContext: string | null | undefined) => void,
): () => void {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as ProfileLastContextRow;
        onUpdate(row?.last_context);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
