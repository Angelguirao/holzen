import type { TFunction } from 'i18next';
import type { NotificationsInboxRow } from '@/features/notifications/public-queries';
import type { NotificationNavigateState } from '@/features/pause/public-navigation';
import type { NotificationInboxItem } from './notification-inbox-item';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Map a `notifications` row to inbox UI (i18n + action). Returns null for unknown types. */
export function mapNotificationInboxRow(
  row: NotificationsInboxRow,
  t: TFunction,
): NotificationInboxItem | null {
  if (!row?.id || !row?.type || !row?.created_at) return null;
  if (row.type !== 'pause') return null;

  const metadata = asRecord(row.metadata);
  const actionPath = getString(row.action_path);
  const actionStateRaw = asRecord(row.action_state);
  const actionState =
    Object.keys(actionStateRaw).length > 0 ? (actionStateRaw as NotificationNavigateState) : undefined;

  const title = t('notifications.pauseReady', { defaultValue: 'Pause ready' });
  const preview = getString(metadata.message) ?? getString(metadata.context) ?? '';
  const subtitle =
    (preview.slice(0, 80) + (preview.length > 80 ? '…' : '')) || title;
  const actionLabel = t('notifications.openPause', { defaultValue: 'Open pause' });

  return {
    id: row.id,
    type: row.type,
    title,
    subtitle,
    timestamp: row.created_at,
    action:
      actionPath && actionLabel
        ? { label: actionLabel, path: actionPath, state: actionState }
        : undefined,
  };
}

export function normalizeNotificationInboxItems(items: NotificationInboxItem[]): NotificationInboxItem[] {
  return [...items]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
}
