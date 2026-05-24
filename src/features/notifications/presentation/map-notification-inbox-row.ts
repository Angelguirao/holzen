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

function getNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

/** Map a `notifications` row to inbox UI (i18n + action). Returns null for unknown types. */
export function mapNotificationInboxRow(
  row: NotificationsInboxRow,
  t: TFunction,
): NotificationInboxItem | null {
  if (!row?.id || !row?.type || !row?.created_at) return null;

  const metadata = asRecord(row.metadata);
  const actionPath = getString(row.action_path);
  const actionStateRaw = asRecord(row.action_state);
  const actionState =
    Object.keys(actionStateRaw).length > 0 ? (actionStateRaw as NotificationNavigateState) : undefined;

  let title = t('notifications.title');
  let subtitle = '';
  let actionLabel: string | null = null;

  if (row.type === 'badge') {
    title = t('notifications.badgeEarned');
    const badgeId = getString(metadata.badge_id);
    subtitle = badgeId ? badgeId.replace(/_/g, ' ') : t('notifications.badgeEarned');
    actionLabel = t('notifications.viewBadges');
  } else if (row.type === 'night_reflection') {
    title = t('notifications.nightReflection');
    const message = getString(metadata.message) ?? '';
    subtitle = message.slice(0, 60) + (message.length > 60 ? '…' : '');
  } else if (row.type === 'letter') {
    title = t('notifications.letterDelivered');
    subtitle = t('notifications.letterFromPast');
    actionLabel = t('notifications.readLetter');
  } else if (row.type === 'insight') {
    title = t('notifications.aiInsightsReady');
    const reflectionCount = getNumber(metadata.reflection_count) ?? 0;
    subtitle = t('notifications.basedOnReflections', { count: reflectionCount });
    actionLabel = t('notifications.viewInsights');
  } else if (row.type === 'pause') {
    title = t('notifications.pauseReady', { defaultValue: 'Pause ready' });
    const preview = getString(metadata.message) ?? getString(metadata.context) ?? '';
    subtitle = preview.slice(0, 80) + (preview.length > 80 ? '…' : '');
    actionLabel = t('notifications.openPause', { defaultValue: 'Open pause' });
  } else {
    return null;
  }

  if (!subtitle) subtitle = title;

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
