import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Clock, X } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';

const SNOOZE_OPTIONS = [
  { hours: 2, labelKey: 'snooze.2h' },
  { hours: 4, labelKey: 'snooze.4h' },
  { hours: 8, labelKey: 'snooze.8h' },
  { hours: 12, labelKey: 'snooze.12h' },
] as const;

export function useSnooze() {
  const { user } = useAuth();
  const [snoozedUntil, setSnoozedUntil] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('snoozed_until')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        const val = (data as any)?.snoozed_until;
        if (val) {
          const d = new Date(val);
          setSnoozedUntil(d > new Date() ? d : null);
        }
      });
  }, [user]);

  const snooze = useCallback(async (hours: number) => {
    if (!user) return;
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    setSnoozedUntil(until);
    await supabase
      .from('profiles')
      .update({ snoozed_until: until.toISOString() } as any)
      .eq('user_id', user.id);
  }, [user]);

  const cancelSnooze = useCallback(async () => {
    if (!user) return;
    setSnoozedUntil(null);
    await supabase
      .from('profiles')
      .update({ snoozed_until: null } as any)
      .eq('user_id', user.id);
  }, [user]);

  const isActive = snoozedUntil ? snoozedUntil > new Date() : false;

  return { snoozedUntil, isActive, snooze, cancelSnooze };
}

export function SnoozeControl() {
  const { t } = useTranslation();
  const { snoozedUntil, isActive, snooze, cancelSnooze } = useSnooze();
  const [open, setOpen] = useState(false);

  const handleSnooze = async (hours: number) => {
    hapticFeedback('light');
    await snooze(hours);
    setOpen(false);
    toast(t('snooze.activated', { hours, defaultValue: `Pauses snoozed for ${hours}h` }), { duration: 3000 });
  };

  const handleCancel = async () => {
    hapticFeedback('light');
    await cancelSnooze();
    toast(t('snooze.cancelled', 'Snooze cancelled'), { duration: 2000 });
  };

  if (isActive && snoozedUntil) {
    const remaining = Math.max(0, snoozedUntil.getTime() - Date.now());
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const timeLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 py-1.5"
      >
        <Moon className="h-3 w-3 text-muted-foreground/50" />
        <p className="text-[10px] font-mono text-muted-foreground/50 flex-1">
          {t('snooze.activeLabel', { time: timeLabel, defaultValue: `Snoozed · {{time}} left` })}
        </p>
        <button
          onClick={handleCancel}
          className="text-[10px] font-mono text-primary/50 hover:text-primary transition-colors"
        >
          {t('snooze.wake', 'Wake')}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors py-1"
      >
        <Moon className="h-3 w-3" />
        {t('snooze.pausePauses', 'Snooze pauses')}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-border/60 bg-background shadow-lg p-2 space-y-1"
          >
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                {t('snooze.snoozeFor', 'Snooze for')}
              </p>
              <button onClick={() => setOpen(false)} className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
            {SNOOZE_OPTIONS.map(({ hours, labelKey }) => (
              <button
                key={hours}
                onClick={() => handleSnooze(hours)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left"
              >
                <Clock className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-xs font-mono text-foreground/70">
                  {t(labelKey, `${hours} hours`)}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
