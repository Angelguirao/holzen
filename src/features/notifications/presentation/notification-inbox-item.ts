import type { NotificationNavigateState } from '@/features/pause/public-navigation';

export type NotificationInboxItem = {
  id: string;
  type: 'pause';
  title: string;
  subtitle: string;
  timestamp: string;
  action?: { label: string; path: string; state?: NotificationNavigateState };
};

export const NOTIFICATION_INBOX_ICON_MAP: Record<NotificationInboxItem['type'], string> = {
  pause: '⚡',
};
