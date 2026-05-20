import { supabase } from '@/integrations/supabase/client';

/** Subscribe to `pause_instances` row changes for a user; returns unsubscribe. */
export function subscribePauseInstancesForUser(
  userId: string,
  channelName: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pause_instances',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    if (typeof supabase.removeChannel === 'function') {
      supabase.removeChannel(channel);
    }
  };
}
