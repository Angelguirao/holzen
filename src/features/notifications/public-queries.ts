/**
 * Notifications TanStack query modules (imports Supabase). App hooks and presentation only —
 * other features use `@/features/notifications/public` for types.
 */
export {
  fetchNotificationsInboxRows,
  getNotificationsInboxMappedListQueryOptions,
  NOTIFICATIONS_INBOX_DISABLED_USER_ID,
  NOTIFICATIONS_INBOX_NONE_QUERY_KEY,
  NOTIFICATIONS_INBOX_QUERY_LEAF,
  NOTIFICATIONS_INBOX_QUERY_PREFIX,
  NOTIFICATIONS_QUERY_PREFIX,
  notificationsInboxQueryKey,
} from './infrastructure/queries/notifications-inbox-query';
export type {
  NotificationsInboxRow,
  NotificationsInboxRowType,
} from './infrastructure/queries/notifications-inbox-query';
export {
  fetchBrowserPushSubscribed,
  getPushSubscriptionQueryOptions,
  PUSH_SUBSCRIPTION_DISABLED_USER_ID,
  PUSH_SUBSCRIPTION_NONE_QUERY_KEY,
  PUSH_SUBSCRIPTION_QUERY_PREFIX,
  pushSubscriptionQueryKey,
} from './infrastructure/queries/push-subscription-query';
