import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, X, CheckCheck, ArrowRight } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import {
  fetchNotificationsInboxRows,
  getNotificationsInboxMappedListQueryOptions,
  notificationsInboxQueryKey,
  type NotificationsInboxRow,
} from '@/lib/notifications-inbox-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationNavigateState } from '@/lib/router-location-state';

const SWIPE_THRESHOLD = 80;

const SwipeableNotification = forwardRef<HTMLDivElement, {
  n: NotificationItem;
  isFresh: boolean;
  iconMap: Record<NotificationItem['type'], string>;
  onDismiss: (id: string) => void;
  onAction: (path: string, state?: NotificationNavigateState) => void;
}>(function SwipeableNotification({ n, isFresh, iconMap, onDismiss, onAction }, _ref) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const elRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current || !elRef.current) return;
    const delta = e.touches[0].clientX - startX.current;
    currentX.current = Math.min(0, delta);
    elRef.current.style.transform = `translateX(${currentX.current}px)`;
    elRef.current.style.opacity = `${1 - Math.abs(currentX.current) / 200}`;
  }, []);

  const handleTouchEnd = useCallback(() => {
    swiping.current = false;
    if (!elRef.current) return;
    if (Math.abs(currentX.current) >= SWIPE_THRESHOLD) {
      hapticFeedback('medium');
      elRef.current.style.transition = 'transform 0.2s, opacity 0.2s';
      elRef.current.style.transform = 'translateX(-100%)';
      elRef.current.style.opacity = '0';
      setTimeout(() => onDismiss(n.id), 200);
    } else {
      elRef.current.style.transition = 'transform 0.2s, opacity 0.2s';
      elRef.current.style.transform = 'translateX(0)';
      elRef.current.style.opacity = '1';
      setTimeout(() => {
        if (elRef.current) elRef.current.style.transition = '';
      }, 200);
    }
  }, [n.id, onDismiss]);

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 items-center justify-end pr-3 bg-destructive/20 swipe-hint">
        <X className="h-3.5 w-3.5 text-destructive" />
      </div>
      <div
        ref={elRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative px-3 py-2.5 bg-popover hover:bg-accent/50 transition-colors group"
      >
        <div className="flex items-start gap-2">
          <span className="text-sm mt-0.5">{iconMap[n.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-foreground leading-tight">{n.title}</p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 truncate">{n.subtitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] text-muted-foreground/60 font-mono">
                {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
              </p>
              {isFresh && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                  aria-label="New notification"
                />
              )}
              {n.action && (
                <button
                  onClick={() => onAction(n.action!.path, n.action!.state)}
                  className="flex items-center gap-0.5 text-[9px] font-sans font-medium text-nox-text-link/75 hover:text-nox-text-link transition-colors"
                >
                  {n.action.label}
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});


type NotificationItem = {
  id: string;
  type: 'badge' | 'night_reflection' | 'letter' | 'insight' | 'pause';
  title: string;
  subtitle: string;
  timestamp: string;
  action?: { label: string; path: string; state?: NotificationNavigateState };
};

const LAST_READ_KEY = 'holzen_notifications_read_at';
const DISMISSED_KEY = 'holzen_notifications_dismissed';

function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

export function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissedIds);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const freshTimersRef = useRef<Map<string, number>>(new Map());

  const normalizeNotifications = useCallback((items: NotificationItem[]) => {
    return [...items]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, []);

  const mapRowToNotification = useCallback((row: NotificationsInboxRow): NotificationItem | null => {
    if (!row?.id || !row?.type || !row?.created_at) return null;

    const metadata = asRecord(row.metadata);
    const actionPath = getString(row.action_path);
    const actionStateRaw = asRecord(row.action_state);
    const actionState = Object.keys(actionStateRaw).length > 0
      ? (actionStateRaw as NotificationNavigateState)
      : undefined;

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
      const preview =
        getString(metadata.message) ?? getString(metadata.context) ?? '';
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
      action: actionPath && actionLabel
        ? { label: actionLabel, path: actionPath, state: actionState }
        : undefined,
    };
  }, [t]);

  const { data: allNotifications = [], isPending: loading } = useQuery(
    getNotificationsInboxMappedListQueryOptions({
      userId: user?.id,
      queryFn: async () => {
        const rows = await fetchNotificationsInboxRows(user!.id);
        const mapped = rows
          .map(mapRowToNotification)
          .filter((item): item is NotificationItem => item !== null);
        return normalizeNotifications(mapped);
      },
    }),
  );

  const visibleNotifications = allNotifications.filter((n) => !dismissed.has(n.id));

  const bumpInbox = useCallback(() => {
    if (!user) return;
    void queryClient.invalidateQueries({ queryKey: notificationsInboxQueryKey(user.id) });
  }, [user, queryClient]);

  const upsertNotification = useCallback(
    (next: NotificationItem) => {
      if (!user) return;
      queryClient.setQueryData<NotificationItem[]>(notificationsInboxQueryKey(user.id), (prev) => {
        const base = prev ?? [];
        const filtered = base.filter((item) => item.id !== next.id);
        return normalizeNotifications([next, ...filtered]);
      });
    },
    [user, queryClient, normalizeNotifications],
  );

  const removeNotification = useCallback(
    (id: string) => {
      if (!user) return;
      queryClient.setQueryData<NotificationItem[]>(notificationsInboxQueryKey(user.id), (prev) =>
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
    const addedIds = allNotifications
      .map((n) => n.id)
      .filter((id) => !previousIds.has(id));

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

    const channel = supabase
      .channel(`notification-bell-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldRow = (payload.old ?? {}) as Record<string, unknown>;
            const id = getString(oldRow.id);
            if (id) removeNotification(id);
            return;
          }

          const row = (payload.new ?? {}) as NotificationsInboxRow;
          if (row.dismissed_at) {
            removeNotification(row.id);
            return;
          }

          const mapped = mapRowToNotification(row);
          if (mapped) upsertNotification(mapped);
          else bumpInbox();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, bumpInbox, mapRowToNotification, removeNotification, upsertNotification]);

  useEffect(() => {
    const visible = allNotifications.filter(n => !dismissed.has(n.id));
    const lastRead = localStorage.getItem(LAST_READ_KEY);
    if (lastRead) {
      const readTime = new Date(lastRead).getTime();
      setUnreadCount(visible.filter(i => new Date(i.timestamp).getTime() > readTime).length);
    } else {
      setUnreadCount(visible.length);
    }
  }, [allNotifications, dismissed]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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

  function handleOpen() {
    setOpen(prev => !prev);
    if (!open) {
      localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
      setUnreadCount(0);
    }
  }

  const handleAction = useCallback((path: string, state?: NotificationNavigateState) => {
    setOpen(false);
    navigate(path, state ? { state } : undefined);
  }, [navigate]);

  const dismissOne = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDismissedIds(next);
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    setDismissed(prev => {
      const next = new Set(prev);
      for (const n of allNotifications) next.add(n.id);
      saveDismissedIds(next);
      return next;
    });
  }, [allNotifications]);

  const iconMap: Record<NotificationItem['type'], string> = {
    badge: '🏅',
    night_reflection: '🌙',
    letter: '✉️',
    insight: '✨',
    pause: '⚡',
  };

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;
  const bellAriaLabel =
    unreadCount > 0
      ? `${t('notifications.title')}, ${displayCount} ${t('notifications.unread', { defaultValue: 'unread' })}`
      : t('notifications.title');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex min-h-9 min-w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
        aria-label={bellAriaLabel}
      >
        <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-mono flex items-center justify-center" aria-hidden>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-md border border-border bg-popover shadow-lg z-50"
          >
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {t('notifications.title')}
              </p>
              {visibleNotifications.length > 0 && (
                <button
                  onClick={dismissAll}
                  className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  title={t('notifications.dismissAll')}
                >
                  <CheckCheck className="h-3 w-3" />
                  {t('notifications.clearAll')}
                </button>
              )}
            </div>

            {loading ? (
              <div className="px-3 py-3 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-full" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">{t('notifications.allCaughtUp')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {visibleNotifications.map(n => (
                    <SwipeableNotification
                      key={n.id}
                      n={n}
                      isFresh={freshIds.has(n.id)}
                      iconMap={iconMap}
                      onDismiss={dismissOne}
                      onAction={handleAction}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
