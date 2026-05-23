import { keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NotificationsInboxRow } from '../../domain/inbox-row';

export type { NotificationsInboxRow, NotificationsInboxRowType } from '../../domain/inbox-row';

export const NOTIFICATIONS_QUERY_PREFIX = ['notifications'] as const;

export const NOTIFICATIONS_INBOX_QUERY_LEAF = 'inbox' as const;

export const NOTIFICATIONS_INBOX_QUERY_PREFIX = [
  ...NOTIFICATIONS_QUERY_PREFIX,
  NOTIFICATIONS_INBOX_QUERY_LEAF,
] as const;

export const NOTIFICATIONS_INBOX_DISABLED_USER_ID = 'none' as const;

export const NOTIFICATIONS_INBOX_NONE_QUERY_KEY = [
  ...NOTIFICATIONS_INBOX_QUERY_PREFIX,
  NOTIFICATIONS_INBOX_DISABLED_USER_ID,
] as const;

export function notificationsInboxQueryKey(userId: string) {
  return [...NOTIFICATIONS_INBOX_QUERY_PREFIX, userId] as const;
}

/** Non-dismissed `notifications` rows. Map to UI + i18n in `NotificationBell`. */
export async function fetchNotificationsInboxRows(userId: string): Promise<NotificationsInboxRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('id, type, metadata, action_path, action_state, created_at, dismissed_at')
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  return (data ?? []) as unknown as NotificationsInboxRow[];
}

export function getNotificationsInboxMappedListQueryOptions<T>(params: {
  userId: string | undefined;
  queryFn: () => Promise<T>;
}) {
  const { userId, queryFn } = params;
  return {
    queryKey: userId ? notificationsInboxQueryKey(userId) : NOTIFICATIONS_INBOX_NONE_QUERY_KEY,
    queryFn,
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
    placeholderData: keepPreviousData,
  } as const;
}
