import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

type NotificationItem = {
  id: string;
  type: 'badge' | 'night_reflection' | 'letter' | 'insight';
  title: string;
  subtitle: string;
  timestamp: string;
};

const LAST_READ_KEY = 'holzen_notifications_read_at';

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      const items: NotificationItem[] = [];

      // Fetch recent badges
      const { data: badges } = await supabase
        .from('user_badges')
        .select('id, badge_id, earned_at')
        .eq('user_id', user!.id)
        .order('earned_at', { ascending: false })
        .limit(10);

      if (badges) {
        for (const b of badges) {
          items.push({
            id: `badge-${b.id}`,
            type: 'badge',
            title: 'Badge earned',
            subtitle: b.badge_id.replace(/_/g, ' '),
            timestamp: b.earned_at,
          });
        }
      }

      // Fetch recent night reflections
      const { data: nights } = await supabase
        .from('night_reflections')
        .select('id, message, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

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

      // Fetch delivered letters
      const { data: letters } = await supabase
        .from('future_letters')
        .select('id, delivered_at')
        .eq('user_id', user!.id)
        .eq('delivered', true)
        .not('delivered_at', 'is', null)
        .order('delivered_at', { ascending: false })
        .limit(5);

      if (letters) {
        for (const l of letters) {
          items.push({
            id: `letter-${l.id}`,
            type: 'letter',
            title: 'Letter delivered',
            subtitle: 'A letter from your past self arrived',
            timestamp: l.delivered_at!,
          });
        }
      }

      // Fetch recent AI insights
      const { data: insights } = await supabase
        .from('reflection_insights')
        .select('id, generated_at, reflection_count')
        .eq('user_id', user!.id)
        .order('generated_at', { ascending: false })
        .limit(3);

      if (insights) {
        for (const i of insights) {
          items.push({
            id: `insight-${i.id}`,
            type: 'insight',
            title: 'AI insights ready',
            subtitle: `Based on ${i.reflection_count} reflections`,
            timestamp: i.generated_at,
          });
        }
      }

      // Sort by timestamp descending
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(items.slice(0, 20));

      // Calculate unread
      const lastRead = localStorage.getItem(LAST_READ_KEY);
      if (lastRead) {
        const readTime = new Date(lastRead).getTime();
        setUnreadCount(items.filter(i => new Date(i.timestamp).getTime() > readTime).length);
      } else {
        setUnreadCount(items.length);
      }
    }

    fetchNotifications();
  }, [user]);

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

  const iconMap: Record<NotificationItem['type'], string> = {
    badge: '🏅',
    night_reflection: '🌙',
    letter: '✉️',
    insight: '✨',
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
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Notifications
              </p>
            </div>

            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">Nothing yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(n => (
                  <div key={n.id} className="px-3 py-2.5 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">{iconMap[n.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-foreground leading-tight">
                          {n.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 truncate">
                          {n.subtitle}
                        </p>
                        <p className="text-[9px] text-muted-foreground/60 font-mono mt-1">
                          {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
