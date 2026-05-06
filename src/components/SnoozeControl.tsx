import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { PROFILE_QUERY_KEY } from '@/hooks/use-profile';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Moon, Clock } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';

const SNOOZE_OPTIONS = [
  { hours: 2, labelKey: 'snooze.2h' },
  { hours: 4, labelKey: 'snooze.4h' },
  { hours: 8, labelKey: 'snooze.8h' },
  { hours: 12, labelKey: 'snooze.12h' },
] as const;

export function useSnooze() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [snoozedUntil, setSnoozedUntil] = useState<Date | null>(null);

  const bumpProfileCache = useCallback(() => {
    if (!user?.id) return;
    void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(user.id) });
  }, [queryClient, user?.id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('snoozed_until')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        const val = data?.snoozed_until;
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
    const { error } = await supabase
      .from('profiles')
      .update({ snoozed_until: until.toISOString() })
      .eq('user_id', user.id);
    if (!error) bumpProfileCache();
  }, [user, bumpProfileCache]);

  const cancelSnooze = useCallback(async () => {
    if (!user) return;
    setSnoozedUntil(null);
    const { error } = await supabase
      .from('profiles')
      .update({ snoozed_until: null })
      .eq('user_id', user.id);
    if (!error) bumpProfileCache();
  }, [user, bumpProfileCache]);

  const isActive = snoozedUntil ? snoozedUntil > new Date() : false;

  return { snoozedUntil, isActive, snooze, cancelSnooze };
}

/** Full-width link + popover (legacy Home layout). Prefer {@link SnoozeToolbarControl} in section headers. */
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

  const handleSnoozeUntilTomorrow = async () => {
    hapticFeedback('light');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    const hours = (tomorrow.getTime() - now.getTime()) / (60 * 60 * 1000);
    await snooze(hours);
    setOpen(false);
    toast(t('snooze.untilTomorrowActivated', { defaultValue: 'Snoozed until tomorrow 8am' }), {
      duration: 3000,
    });
  };

  const handleCancel = async () => {
    hapticFeedback('light');
    await cancelSnooze();
    toast(t('snooze.cancelled', { defaultValue: 'Snooze cancelled' }), { duration: 2000 });
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
        <p className={`${homeInWidget.meta} flex-1 text-muted-foreground/80`}>
          {t('snooze.activeLabel', { time: timeLabel, defaultValue: `Snoozed · {{time}} left` })}
        </p>
        <button
          onClick={handleCancel}
          type="button"
          className="text-xs font-medium text-nox-text-link/80 transition-colors hover:text-nox-text-link"
        >
          {t('snooze.wake', { defaultValue: 'Wake' })}
        </button>
      </motion.div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 py-1 leading-snug font-sans font-medium text-nox-text-link hover:text-nox-text-link/80 text-base"
        >
          <Moon className="h-3.5 w-3.5" />
          {t('snooze.pausePauses', { defaultValue: 'Snooze pauses' })}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-2 space-y-1">
        <p className={`px-2 pb-1 ${homeInWidget.kicker}`}>
          {t('snooze.snoozeFor', { defaultValue: 'Snooze for' })}
        </p>
        {SNOOZE_OPTIONS.map(({ hours, labelKey }) => (
          <button
            key={hours}
            onClick={() => handleSnooze(hours)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
          >
            <Clock className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-sm font-medium text-foreground/80">
              {t(labelKey, { defaultValue: `${hours} hours` })}
            </span>
          </button>
        ))}
        <button
          onClick={handleSnoozeUntilTomorrow}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
        >
          <Clock className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-sm font-medium text-foreground/80">
            {t('snooze.untilTomorrow', { defaultValue: 'Until tomorrow (8am)' })}
          </span>
        </button>
      </PopoverContent>
    </Popover>
  );
}

/** Icon + popover for Home section headers (matches Market/BtcStatus hit targets). */
export function SnoozeToolbarControl() {
  const { t } = useTranslation();
  const { snoozedUntil, isActive, snooze, cancelSnooze } = useSnooze();
  const [open, setOpen] = useState(false);

  const handleSnooze = async (hours: number) => {
    hapticFeedback('light');
    await snooze(hours);
    setOpen(false);
    toast(t('snooze.activated', { hours, defaultValue: `Pauses snoozed for ${hours}h` }), { duration: 3000 });
  };

  const handleSnoozeUntilTomorrow = async () => {
    hapticFeedback('light');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    const hours = (tomorrow.getTime() - now.getTime()) / (60 * 60 * 1000);
    await snooze(hours);
    setOpen(false);
    toast(t('snooze.untilTomorrowActivated', { defaultValue: 'Snoozed until tomorrow 8am' }), {
      duration: 3000,
    });
  };

  const handleCancel = async () => {
    hapticFeedback('light');
    await cancelSnooze();
    setOpen(false);
    toast(t('snooze.cancelled', { defaultValue: 'Snooze cancelled' }), { duration: 2000 });
  };

  const activeTimeLabel =
    isActive && snoozedUntil
      ? (() => {
          const remaining = Math.max(0, snoozedUntil.getTime() - Date.now());
          const hours = Math.floor(remaining / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        })()
      : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            homeInWidget.iconBtn,
            isActive && 'text-nox-text-highlight hover:text-nox-text-highlight/80',
          )}
          aria-label={t('snooze.toolbarAria', { defaultValue: 'Snooze automatic pauses' })}
          aria-expanded={open}
        >
          <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2 space-y-1">
        {isActive && snoozedUntil ? (
          <>
            <p className={`px-2 pb-1 ${homeInWidget.meta}`}>
              {t('snooze.activeLabel', { time: activeTimeLabel, defaultValue: `Snoozed · {{time}} left` })}
            </p>
            <button
              type="button"
              onClick={handleCancel}
              className="flex w-full items-center justify-center rounded-lg border border-border/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
            >
              {t('snooze.wake', { defaultValue: 'Wake' })}
            </button>
          </>
        ) : (
          <>
            <p className={`px-2 pb-1 ${homeInWidget.kicker}`}>
              {t('snooze.snoozeFor', { defaultValue: 'Snooze for' })}
            </p>
            {SNOOZE_OPTIONS.map(({ hours, labelKey }) => (
              <button
                key={hours}
                type="button"
                onClick={() => handleSnooze(hours)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <Clock className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-sm font-medium text-foreground/80">
                  {t(labelKey, { defaultValue: `${hours} hours` })}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={handleSnoozeUntilTomorrow}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
            >
              <Clock className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-sm font-medium text-foreground/80">
                {t('snooze.untilTomorrow', { defaultValue: 'Until tomorrow (8am)' })}
              </span>
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
