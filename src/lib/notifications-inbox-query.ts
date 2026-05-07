import { supabase } from '@/integrations/supabase/client';

export type NotificationsInboxRowType = 'badge' | 'night_reflection' | 'letter' | 'insight' | 'pause';

export type NotificationsInboxRow = {
  id: string;
  type: NotificationsInboxRowType;
  metadata: unknown;
  action_path: string | null;
  action_state: unknown;
  created_at: string;
  dismissed_at: string | null;
};

export const NOTIFICATIONS_INBOX_NONE_QUERY_KEY = ['notifications', 'inbox', 'none'] as const;

export function notificationsInboxQueryKey(userId: string) {
  return ['notifications', 'inbox', userId] as const;
}

/** Non-dismissed notifications for inbox UI (mapping/i18n stays in `NotificationBell`). */
export async function fetchNotificationsInboxRows(userId: string): Promise<NotificationsInboxRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('id, type, metadata, action_path, action_state, created_at, dismissed_at')
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  return ((data ?? []) as unknown as NotificationsInboxRow[]);
}
