import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, ArrowRight } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const SWIPE_THRESHOLD = 80;

function SwipeableNotification({
  n,
  iconMap,
  onDismiss,
  onAction,
}: {
  n: NotificationItem;
  iconMap: Record<NotificationItem['type'], string>;
  onDismiss: (id: string) => void;
  onAction: (path: string) => void;
}) {
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
    // Only allow swiping left (negative)
    currentX.current = Math.min(0, delta);
    elRef.current.style.transform = `translateX(${currentX.current}px)`;
    elRef.current.style.opacity = `${1 - Math.abs(currentX.current) / 200}`;
  }, []);

  const handleTouchEnd = useCallback(() => {
    swiping.current = false;
    if (!elRef.current) return;
    if (Math.abs(currentX.current) >= SWIPE_THRESHOLD) {
      // Animate out then dismiss
      elRef.current.style.transition = 'transform 0.2s, opacity 0.2s';
      elRef.current.style.transform = 'translateX(-100%)';
      elRef.current.style.opacity = '0';
      setTimeout(() => onDismiss(n.id), 200);
    } else {
      // Snap back
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
      {/* Red background revealed on swipe */}
      <div className="absolute inset-0 flex items-center justify-end pr-3 bg-destructive/20">
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
            <p className="text-[11px] font-medium text-foreground leading-tight">
              {n.title}
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 truncate">
              {n.subtitle}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] text-muted-foreground/60 font-mono">
                {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
              </p>
              {n.action && (
                <button
                  onClick={() => onAction(n.action!.path)}
                  className="flex items-center gap-0.5 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors"
                >
                  {n.action.label}
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all shrink-0 mt-0.5"
            aria-label="Dismiss notification"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

type NotificationItem = {
  id: string;
  type: 'badge' | 'night_reflection' | 'letter' | 'insight' | 'reflection' | 'ritual';
  title: string;
  subtitle: string;
  timestamp: string;
  action?: { label: string; path: string };
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

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissedIds);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const visibleNotifications = allNotifications.filter(n => !dismissed.has(n.id));

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      setLoading(true);
      const items: NotificationItem[] = [];

      const [
        { data: badges },
        { data: nights },
        { data: letters },
        { data: reflections },
        { data: rituals },
        { data: insights },
      ] = await Promise.all([
        supabase.from('user_badges').select('id, badge_id, earned_at').eq('user_id', user!.id).order('earned_at', { ascending: false }).limit(10),
        supabase.from('night_reflections').select('id, message, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('future_letters').select('id, delivered_at').eq('user_id', user!.id).eq('delivered', true).not('delivered_at', 'is', null).order('delivered_at', { ascending: false }).limit(5),
        supabase.from('reflections').select('id, message, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('ritual_completions').select('id, decision, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('reflection_insights').select('id, generated_at, reflection_count').eq('user_id', user!.id).order('generated_at', { ascending: false }).limit(3),
      ]);

      if (badges) {
        for (const b of badges) {
          items.push({
            id: `badge-${b.id}`,
            type: 'badge',
            title: 'Badge earned',
            subtitle: b.badge_id.replace(/_/g, ' '),
            timestamp: b.earned_at,
            action: { label: 'View badges', path: '/profile' },
          });
        }
      }

      if (nights) {
        for (const n of nights) {
          items.push({
            id: `night-${n.id}`,
            type: 'night_reflection',
            title: 'Night reflection',
            subtitle: n.message.slice(0, 60) + (n.message.length > 60 ? '…' : ''),
            timestamp: n.created_at,
          });
        }
      }

      if (letters) {
        for (const l of letters) {
          items.push({
            id: `letter-${l.id}`,
            type: 'letter',
            title: 'Letter delivered',
            subtitle: 'A letter from your past self arrived',
            timestamp: l.delivered_at!,
            action: { label: 'Read letter', path: '/profile' },
          });
        }
      }

      if (reflections) {
        for (const r of reflections) {
          items.push({
            id: `reflection-${r.id}`,
            type: 'reflection',
            title: 'Reflection triggered',
            subtitle: r.message.slice(0, 60) + (r.message.length > 60 ? '…' : ''),
            timestamp: r.created_at,
            action: { label: 'View in history', path: '/history' },
          });
        }
      }

      if (rituals) {
        const decisionLabels: Record<string, string> = {
          held: 'hold', sold: 'sell', bought: 'buy', nothing: 'do nothing',
        };
        for (const r of rituals) {
          items.push({
            id: `ritual-${r.id}`,
            type: 'ritual',
            title: 'Ritual completed',
            subtitle: `Decision: ${decisionLabels[r.decision] || r.decision}`,
            timestamp: r.created_at,
            action: { label: 'View history', path: '/history' },
          });
        }
      }

      if (insights) {
        for (const i of insights) {
          items.push({
            id: `insight-${i.id}`,
            type: 'insight',
            title: 'AI insights ready',
            subtitle: `Based on ${i.reflection_count} reflections`,
            timestamp: i.generated_at,
            action: { label: 'View insights', path: '/profile' },
          });
        }
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAllNotifications(items.slice(0, 20));
      setLoading(false);
    }

    fetchNotifications();
  }, [user]);

  // Recalculate unread when notifications or dismissed change
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

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleOpen() {
    setOpen(prev => !prev);
    if (!open) {
      localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
      setUnreadCount(0);
    }
  }

  const handleAction = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
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
    reflection: '📝',
    ritual: '🔮',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-md hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-mono flex items-center justify-center">
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
                Notifications
              </p>
              {visibleNotifications.length > 0 && (
                <button
                  onClick={dismissAll}
                  className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  title="Dismiss all"
                >
                  <CheckCheck className="h-3 w-3" />
                  Clear all
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
                <p className="text-xs text-muted-foreground">All caught up</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {visibleNotifications.map(n => (
                    <SwipeableNotification
                      key={n.id}
                      n={n}
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
