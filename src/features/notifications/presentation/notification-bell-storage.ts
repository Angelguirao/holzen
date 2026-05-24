export const NOTIFICATIONS_LAST_READ_KEY = 'holzen_notifications_read_at';
export const NOTIFICATIONS_DISMISSED_KEY = 'holzen_notifications_dismissed';

export function getDismissedNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveDismissedNotificationIds(ids: Set<string>): void {
  localStorage.setItem(NOTIFICATIONS_DISMISSED_KEY, JSON.stringify([...ids]));
}

export function markNotificationsReadAt(isoTimestamp: string): void {
  localStorage.setItem(NOTIFICATIONS_LAST_READ_KEY, isoTimestamp);
}

export function getNotificationsLastReadAt(): string | null {
  return localStorage.getItem(NOTIFICATIONS_LAST_READ_KEY);
}
