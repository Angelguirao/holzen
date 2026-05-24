import { forwardRef, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback } from '@/lib/haptics';
import type { NotificationNavigateState } from '@/features/pause/public-navigation';
import {
  NOTIFICATION_INBOX_ICON_MAP,
  type NotificationInboxItem,
} from './notification-inbox-item';

const SWIPE_THRESHOLD = 80;

type NotificationBellSwipeableRowProps = {
  item: NotificationInboxItem;
  isFresh: boolean;
  onDismiss: (id: string) => void;
  onAction: (path: string, state?: NotificationNavigateState) => void;
};

export const NotificationBellSwipeableRow = forwardRef<
  HTMLDivElement,
  NotificationBellSwipeableRowProps
>(function NotificationBellSwipeableRow({ item, isFresh, onDismiss, onAction }, _ref) {
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
      setTimeout(() => onDismiss(item.id), 200);
    } else {
      elRef.current.style.transition = 'transform 0.2s, opacity 0.2s';
      elRef.current.style.transform = 'translateX(0)';
      elRef.current.style.opacity = '1';
      setTimeout(() => {
        if (elRef.current) elRef.current.style.transition = '';
      }, 200);
    }
  }, [item.id, onDismiss]);

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
          <span className="text-sm mt-0.5">{NOTIFICATION_INBOX_ICON_MAP[item.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-foreground leading-tight">{item.title}</p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 truncate">
              {item.subtitle}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] text-muted-foreground/60 font-mono">
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </p>
              {isFresh && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                  aria-label="New notification"
                />
              )}
              {item.action && (
                <button
                  type="button"
                  onClick={() => onAction(item.action!.path, item.action!.state)}
                  className="flex items-center gap-0.5 text-[9px] font-sans font-medium text-nox-text-link/75 hover:text-nox-text-link transition-colors"
                >
                  {item.action.label}
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
