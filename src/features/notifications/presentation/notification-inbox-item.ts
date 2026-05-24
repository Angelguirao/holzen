import type { NotificationNavigateState } from '@/features/pause/public-navigation';

export type NotificationInboxItem = {
  id: string;
  type: 'badge' | 'night_reflection' | 'letter' | 'insight' | 'pause';
  title: string;
  subtitle: string;
  timestamp: string;
  action?: { label: string; path: string; state?: NotificationNavigateState };
};

export const NOTIFICATION_INBOX_ICON_MAP: Record<NotificationInboxItem['type'], string> = {
  badge: '🏅',
  night_reflection: '🌙',
  letter: '✉️',
  insight: '✨',
  pause: '⚡',
};
