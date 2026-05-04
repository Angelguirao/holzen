import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrentPause } from '@/hooks/use-current-pause';
import { usePendingPauseOffer } from '@/hooks/use-pending-pause-offer';
import { pauseWindowShowsClockCountdown } from '@/lib/pause-state';
import { PauseEngagedOpenMaxCountdown } from '@/components/pause/PauseEngagedOpenMaxCountdown';
import { cn } from '@/lib/utils';

/**
 * Surfaces the user's open pause (active or engaged) with a CTA to `/pause`.
 * Used on Library, Archive, and Tools — no reflection text (privacy + calm chrome).
 */
export function CurrentPauseCard() {
  const { loaded, current } = useCurrentPause();
  const { pending } = usePendingPauseOffer();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!loaded) return null;
  if (!current) return null;

  const showWindowClock = pauseWindowShowsClockCountdown(current.window_ends_at);
  const windowLabel = t('library.currentPauseWindow', {
    defaultValue: 'open until',
  });
  const windowEnd = new Date(current.window_ends_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isEngaged = current.state === 'engaged';
  const statusLabel = isEngaged
    ? t('library.currentPauseStatusEngaged', { defaultValue: 'In ritual' })
    : t('library.currentPauseStatusActive', { defaultValue: 'Active' });

  return (
    <div className="w-full space-y-2">
      {pending ? (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-center text-[11px] leading-snug text-foreground/90">
          {t('library.pendingPauseHint', {
            defaultValue:
              'New market context is queued — your Home pause card and pause screen both show how to switch or keep your current pause.',
          })}
        </p>
      ) : null}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() =>
          navigate('/pause', {
            state: {
              pauseInstanceId: current.id,
              severity:
                typeof current.context_snapshot?.severity === 'string'
                  ? current.context_snapshot.severity
                  : 'mild',
            },
          })
        }
        className="w-full rounded-2xl border border-nox-border-default/80 bg-nox-background-accent/25 px-4 py-4 text-left transition-colors hover:bg-nox-background-accent/35 focus:outline-none focus:ring-2 focus:ring-nox-border-focus/50"
        aria-label={t('library.openCurrentPause', {
          defaultValue: 'Open your current pause',
        })}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-full bg-nox-text-highlight/15 p-2 text-nox-text-highlight">
            <Pause className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-nox-text-highlight">
                {t('library.currentPause', { defaultValue: 'Current pause' })}
              </p>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  isEngaged
                    ? 'border-primary/35 bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 bg-muted/30 text-muted-foreground',
                )}
              >
                {statusLabel}
              </span>
            </div>
            {isEngaged && current.engaged_at ? (
              <PauseEngagedOpenMaxCountdown
                engagedAtIso={current.engaged_at}
                className="text-[11px] font-mono tabular-nums text-muted-foreground"
              />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {showWindowClock ? (
                <p className="text-[10px] font-mono text-muted-foreground">
                  {windowLabel} {windowEnd}
                </p>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1 text-xs font-medium text-nox-text-link">
                {t('library.openPauseCta', { defaultValue: 'Open pause' })}
                <ArrowRight className="h-3 w-3" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
