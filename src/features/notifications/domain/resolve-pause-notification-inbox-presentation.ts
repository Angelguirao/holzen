import type { TFunction } from 'i18next';
import type { NotificationsInboxRow } from '@/features/notifications/domain/inbox-row';
import type { NotificationNavigateState } from '@/features/pause/public-navigation';

export type OpenPauseNotificationContext = {
  instanceId: string | null;
  state: 'active' | 'engaged' | null;
  openMaxExpired: boolean;
  pendingOfferInstanceId: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function truncatePreview(text: string, maxChars = 80): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trimEnd()}…`;
}

function pauseInstanceIdFromRow(row: NotificationsInboxRow): string | null {
  const metadata = asRecord(row.metadata);
  const actionState = asRecord(row.action_state);
  return getString(actionState.pauseInstanceId) ?? getString(metadata.pause_instance_id);
}

function isPendingOfferRow(row: NotificationsInboxRow): boolean {
  const metadata = asRecord(row.metadata);
  const actionState = asRecord(row.action_state);
  return metadata.pending_offer === true || actionState.pendingOffer === 'true';
}

/** Maps a pause inbox row to title, subtitle, and an optional deep-link action. */
export function resolvePauseNotificationInboxPresentation(
  row: NotificationsInboxRow,
  t: TFunction,
  openPause: OpenPauseNotificationContext,
): { title: string; subtitle: string; action?: { label: string; path: string; state?: NotificationNavigateState } } {
  const metadata = asRecord(row.metadata);
  const actionStateRaw = asRecord(row.action_state);
  const actionState =
    Object.keys(actionStateRaw).length > 0 ? (actionStateRaw as NotificationNavigateState) : undefined;

  const pauseInstanceId = pauseInstanceIdFromRow(row);
  const context = getString(metadata.context);
  const message = getString(metadata.message);
  const hasReflection = Boolean(message);

  if (isPendingOfferRow(row)) {
    const title = t('notifications.newPauseAvailable', { defaultValue: 'New pause available' });
    const subtitle = truncatePreview(context ?? '') || title;
    const pendingStillQueued =
      Boolean(pauseInstanceId) &&
      Boolean(openPause.pendingOfferInstanceId) &&
      pauseInstanceId === openPause.pendingOfferInstanceId;

    if (pendingStillQueued) {
      return {
        title,
        subtitle,
        action: {
          label: t('notifications.viewOnHome', { defaultValue: 'View on Home' }),
          path: '/',
        },
      };
    }

    return {
      title,
      subtitle: t('notifications.pauseNoLongerAvailable', {
        defaultValue: 'This offer is no longer available.',
      }),
    };
  }

  const title = hasReflection
    ? t('notifications.continueYourPause', { defaultValue: 'Continue your pause' })
    : t('notifications.pauseReady', { defaultValue: 'Pause ready' });

  const previewBody = hasReflection ? (message ?? '') : (context ?? '');
  let subtitle = truncatePreview(previewBody) || title;

  const isCurrentOpen =
    Boolean(openPause.instanceId) &&
    Boolean(pauseInstanceId) &&
    openPause.instanceId === pauseInstanceId;

  const canNavigate =
    isCurrentOpen && Boolean(openPause.state) && !openPause.openMaxExpired && Boolean(row.action_path);

  if (!canNavigate) {
    if (pauseInstanceId && !isCurrentOpen) {
      subtitle = t('notifications.pauseNoLongerAvailable', {
        defaultValue: 'This offer is no longer available.',
      });
    } else if (isCurrentOpen && openPause.openMaxExpired) {
      subtitle = t('notifications.pauseClosed', {
        defaultValue: 'This pause has closed.',
      });
    }
    return { title, subtitle };
  }

  const label =
    openPause.state === 'engaged'
      ? t('notifications.continuePause', { defaultValue: 'Continue' })
      : t('notifications.openPause', { defaultValue: 'Open pause' });

  return {
    title,
    subtitle,
    action: {
      label,
      path: row.action_path!,
      state: actionState,
    },
  };
}
