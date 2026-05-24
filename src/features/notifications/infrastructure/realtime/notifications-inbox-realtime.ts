import { supabase } from '@/integrations/supabase/client';
import type { NotificationsInboxRow } from '../../domain/inbox-row';

export type NotificationsInboxRealtimePayload = {
  eventType: string;
  old: Record<string, unknown>;
  new: NotificationsInboxRow | null;
};

/** Realtime `notifications` rows for the inbox bell (Postgres changes). */
export function subscribeNotificationsInbox(
  userId: string,
  onPayload: (payload: NotificationsInboxRealtimePayload) => void,
): () => void {
  const channel = supabase
    .channel(`notification-bell-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onPayload({
          eventType: payload.eventType,
          old: (payload.old ?? {}) as Record<string, unknown>,
          new: (payload.new ?? null) as NotificationsInboxRow | null,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
