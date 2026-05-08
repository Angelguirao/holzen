import { keepPreviousData } from '@tanstack/react-query';
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

/** Non-dismissed `notifications` rows. Map to UI + i18n in `NotificationBell` (or pass a `queryFn` into {@link getNotificationsInboxMappedListQueryOptions}). */
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

/**
 * TanStack shell for the inbox list query. Caller supplies `queryFn` that returns
 * UI-ready items (i18n mapping + sort cap) so `setQueryData` optimistic paths stay typed.
 */
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
