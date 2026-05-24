import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fetchNotificationsInboxRows,
  getNotificationsInboxMappedListQueryOptions,
  notificationsInboxQueryKey,
  type NotificationsInboxRow,
} from '@/features/notifications/public-queries';
import { useAuth } from '@/features/auth/public';
import type { NotificationNavigateState } from '@/features/pause/public-navigation';
import { subscribeNotificationsInbox } from './notifications-inbox-realtime-io';
import {
  getDismissedNotificationIds,
  getNotificationsLastReadAt,
  markNotificationsReadAt,
  saveDismissedNotificationIds,
} from './notification-bell-storage';
import {
  mapNotificationInboxRow,
  normalizeNotificationInboxItems,
} from './map-notification-inbox-row';
import type { NotificationInboxItem } from './notification-inbox-item';

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function useNotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissedNotificationIds);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const freshTimersRef = useRef<Map<string, number>>(new Map());

  const mapRowToNotification = useCallback(
    (row: NotificationsInboxRow) => mapNotificationInboxRow(row, t),
    [t],
  );

  const { data: allNotifications = [], isPending: loading } = useQuery(
    getNotificationsInboxMappedListQueryOptions({
      userId: user?.id,
      queryFn: async () => {
        const rows = await fetchNotificationsInboxRows(user!.id);
        const mapped = rows
          .map(mapRowToNotification)
          .filter((item): item is NotificationInboxItem => item !== null);
        return normalizeNotificationInboxItems(mapped);
      },
    }),
  );

  const visibleNotifications = allNotifications.filter((n) => !dismissed.has(n.id));

  const bumpInbox = useCallback(() => {
    if (!user) return;
    void queryClient.invalidateQueries({ queryKey: notificationsInboxQueryKey(user.id) });
  }, [user, queryClient]);

  const upsertNotification = useCallback(
    (next: NotificationInboxItem) => {
      if (!user) return;
      queryClient.setQueryData<NotificationInboxItem[]>(notificationsInboxQueryKey(user.id), (prev) => {
        const base = prev ?? [];
        const filtered = base.filter((item) => item.id !== next.id);
        return normalizeNotificationInboxItems([next, ...filtered]);
      });
    },
    [user, queryClient],
  );

  const removeNotification = useCallback(
    (id: string) => {
      if (!user) return;
      queryClient.setQueryData<NotificationInboxItem[]>(notificationsInboxQueryKey(user.id), (prev) =>
        (prev ?? []).filter((item) => item.id !== id),
      );
      setFreshIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const timer = freshTimersRef.current.get(id);
      if (timer) {
        window.clearTimeout(timer);
        freshTimersRef.current.delete(id);
      }
    },
    [user, queryClient],
  );

  useEffect(() => {
    const previousIds = previousIdsRef.current;
    const currentIds = new Set(allNotifications.map((n) => n.id));
    const addedIds = allNotifications.map((n) => n.id).filter((id) => !previousIds.has(id));

    if (previousIds.size > 0 && addedIds.length > 0) {
      setFreshIds((prev) => {
        const next = new Set(prev);
        for (const id of addedIds) next.add(id);
        return next;
      });

      for (const id of addedIds) {
        const existingTimer = freshTimersRef.current.get(id);
        if (existingTimer) window.clearTimeout(existingTimer);
        const timer = window.setTimeout(() => {
          setFreshIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          freshTimersRef.current.delete(id);
        }, 5000);
        freshTimersRef.current.set(id, timer);
      }
    }

    previousIdsRef.current = currentIds;
  }, [allNotifications]);

  useEffect(() => {
    if (!user) return;

    return subscribeNotificationsInbox(user.id, (payload) => {
      if (payload.eventType === 'DELETE') {
        const id = getString(payload.old.id);
        if (id) removeNotification(id);
        return;
      }

      const row = payload.new;
      if (!row) {
        bumpInbox();
        return;
      }

      if (row.dismissed_at) {
        removeNotification(row.id);
        return;
      }

      const mapped = mapRowToNotification(row);
      if (mapped) upsertNotification(mapped);
      else bumpInbox();
    });
  }, [user, bumpInbox, mapRowToNotification, removeNotification, upsertNotification]);

  useEffect(() => {
    const visible = allNotifications.filter((n) => !dismissed.has(n.id));
    const lastRead = getNotificationsLastReadAt();
    if (lastRead) {
      const readTime = new Date(lastRead).getTime();
      setUnreadCount(visible.filter((i) => new Date(i.timestamp).getTime() > readTime).length);
    } else {
      setUnreadCount(visible.length);
    }
  }, [allNotifications, dismissed]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    const timers = freshTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        markNotificationsReadAt(new Date().toISOString());
        setUnreadCount(0);
      }
      return next;
    });
  }, []);

  const handleAction = useCallback(
    (path: string, state?: NotificationNavigateState) => {
      setOpen(false);
      navigate(path, state ? { state } : undefined);
    },
    [navigate],
  );

  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissedNotificationIds(next);
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    setDismissed((prev) => {
      const next = new Set(prev);
      for (const n of allNotifications) next.add(n.id);
      saveDismissedNotificationIds(next);
      return next;
    });
  }, [allNotifications]);

  const displayCount = unreadCount > 9 ? '9+' : String(unreadCount);
  const bellAriaLabel =
    unreadCount > 0
      ? `${t('notifications.title')}, ${displayCount} ${t('notifications.unread', { defaultValue: 'unread' })}`
      : t('notifications.title');

  return {
    panelRef,
    open,
    loading,
    visibleNotifications,
    unreadCount,
    displayCount,
    bellAriaLabel,
    freshIds,
    toggleOpen,
    handleAction,
    dismissOne,
    dismissAll,
    t,
  };
}
