import { Bell, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBellSwipeableRow } from './NotificationBellSwipeableRow';
import { useNotificationBell } from './use-notification-bell';

export function NotificationBell() {
  const {
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
  } = useNotificationBell();

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative inline-flex min-h-9 min-w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
        aria-label={bellAriaLabel}
      >
        <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-mono flex items-center justify-center"
            aria-hidden
          >
            {displayCount}
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
                  type="button"
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
                {[1, 2, 3].map((i) => (
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
                  {visibleNotifications.map((item) => (
                    <NotificationBellSwipeableRow
                      key={item.id}
                      item={item}
                      isFresh={freshIds.has(item.id)}
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
