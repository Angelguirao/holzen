import type { TFunction } from 'i18next';
import type { NotificationsInboxRow } from '@/features/notifications/domain/inbox-row';
import {
  resolvePauseNotificationInboxPresentation,
  type OpenPauseNotificationContext,
} from '@/features/notifications/domain/resolve-pause-notification-inbox-presentation';
import type { NotificationInboxItem } from './notification-inbox-item';

/** Map a `notifications` row to inbox UI (i18n + action). Returns null for unknown types. */
export function mapNotificationInboxRow(
  row: NotificationsInboxRow,
  t: TFunction,
  openPause: OpenPauseNotificationContext,
): NotificationInboxItem | null {
  if (!row?.id || !row?.type || !row?.created_at) return null;
  if (row.type !== 'pause') return null;

  const presentation = resolvePauseNotificationInboxPresentation(row, t, openPause);

  return {
    id: row.id,
    type: row.type,
    title: presentation.title,
    subtitle: presentation.subtitle,
    timestamp: row.created_at,
    action: presentation.action,
  };
}

export function normalizeNotificationInboxItems(items: NotificationInboxItem[]): NotificationInboxItem[] {
  return [...items]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
}
