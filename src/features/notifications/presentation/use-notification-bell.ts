import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fetchNotificationsInboxRows,
  getNotificationsInboxMappedListQueryOptions,
  notificationsInboxQueryKey,
  type NotificationsInboxRow,
} from '@/features/notifications/public-queries';
import {
  dismissAllNotificationsInboxRows,
  dismissNotificationsInboxRow,
} from '@/features/notifications/infrastructure/queries/dismiss-notifications-inbox-query';
import { useAuth } from '@/features/auth/public';
import type { NotificationNavigateState } from '@/features/pause/public-navigation';
import { subscribeNotificationsInbox } from './notifications-inbox-realtime-io';
import {
  getNotificationsLastReadAt,
  markNotificationsReadAt,
} from './notification-bell-storage';
import {
  mapNotificationInboxRow,
  normalizeNotificationInboxItems,
} from './map-notification-inbox-row';
import type { NotificationInboxItem } from './notification-inbox-item';
import { useOpenPauseNotificationContext } from './use-open-pause-notification-context';

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function useNotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const openPause = useOpenPauseNotificationContext();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const freshTimersRef = useRef<Map<string, number>>(new Map());

  const mapRowToNotification = useCallback(
    (row: NotificationsInboxRow) => mapNotificationInboxRow(row, t, openPause),
    [t, openPause],
  );

  const { data: inboxRows = [], isPending: loading } = useQuery(
    getNotificationsInboxMappedListQueryOptions({
      userId: user?.id,
      queryFn: async () => fetchNotificationsInboxRows(user!.id),
    }),
  );

  const allNotifications = useMemo(() => {
    const mapped = inboxRows
      .map(mapRowToNotification)
      .filter((item): item is NotificationInboxItem => item !== null);
    return normalizeNotificationInboxItems(mapped);
  }, [inboxRows, mapRowToNotification]);

  const visibleNotifications = allNotifications;

  const bumpInbox = useCallback(() => {
    if (!user) return;
    void queryClient.invalidateQueries({ queryKey: notificationsInboxQueryKey(user.id) });
  }, [user, queryClient]);

  const removeNotification = useCallback(
    (id: string) => {
      if (!user) return;
      queryClient.setQueryData<NotificationsInboxRow[]>(notificationsInboxQueryKey(user.id), (prev) =>
        (prev ?? []).filter((row) => row.id !== id),
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
      if (mapped) {
        queryClient.setQueryData<NotificationsInboxRow[]>(notificationsInboxQueryKey(user.id), (prev) => {
          const base = prev ?? [];
          const filtered = base.filter((item) => item.id !== row.id);
          return [row, ...filtered];
        });
      } else {
        bumpInbox();
      }
    });
  }, [user, bumpInbox, mapRowToNotification, removeNotification, queryClient]);

  useEffect(() => {
    const lastRead = getNotificationsLastReadAt();
    if (lastRead) {
      const readTime = new Date(lastRead).getTime();
      setUnreadCount(
        visibleNotifications.filter((i) => new Date(i.timestamp).getTime() > readTime).length,
      );
    } else {
      setUnreadCount(visibleNotifications.length);
    }
  }, [visibleNotifications]);

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

  const dismissOne = useCallback(
    (id: string) => {
      if (!user) return;
      removeNotification(id);
      void dismissNotificationsInboxRow(user.id, id).catch(() => bumpInbox());
    },
    [user, removeNotification, bumpInbox],
  );

  const dismissAll = useCallback(() => {
    if (!user) return;
    const ids = visibleNotifications.map((n) => n.id);
    for (const id of ids) removeNotification(id);
    void dismissAllNotificationsInboxRows(user.id, ids).catch(() => bumpInbox());
  }, [user, visibleNotifications, removeNotification, bumpInbox]);

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
