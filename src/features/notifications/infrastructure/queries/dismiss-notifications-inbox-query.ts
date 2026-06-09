import { supabase } from '@/integrations/supabase/client';

/** Persist inbox dismiss — matches `notifications_from_pause_instances` terminal dismiss. */
export async function dismissNotificationsInboxRow(userId: string, notificationId: string): Promise<void> {
  const dismissedAt = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: dismissedAt })
    .eq('user_id', userId)
    .eq('id', notificationId);
  if (error) throw error;
}

export async function dismissAllNotificationsInboxRows(
  userId: string,
  notificationIds: readonly string[],
): Promise<void> {
  if (notificationIds.length === 0) return;
  const dismissedAt = new Date().toISOString();
  const { error } = await supabase
    .from('notifications')
    .update({ dismissed_at: dismissedAt })
    .eq('user_id', userId)
    .in('id', [...notificationIds]);
  if (error) throw error;
}
