import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrentPause } from '@/hooks/use-current-pause';
import { usePendingPauseOffer } from '@/hooks/use-pending-pause-offer';
import { pauseWindowShowsClockCountdown } from '@/lib/pause-state';

/**
 * Library's "Current pause" card. Renders only while the caller has an
 * active or engaged pause (one at a time per user, enforced by the DB
 * partial unique index). Tapping it navigates to `/pause` with the
 * instance id in navigation state so PauseSession hydrates directly.
 *
 * Hidden entirely when the user has no open pause.
 *
 * Below this card, Library's existing history list continues to render
 * everything non-active as before.
 */
export function CurrentPauseCard() {
  const { loaded, current } = useCurrentPause();
  const { pending } = usePendingPauseOffer();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!loaded) return null;
  if (!current) return null;

  const preview =
    current.reflection_message?.slice(0, 120) ??
    (typeof current.context_snapshot?.context_text === 'string'
      ? (current.context_snapshot.context_text as string).slice(0, 120)
      : '');

  const showWindowClock = pauseWindowShowsClockCountdown(current.window_ends_at);
  const windowLabel = t('library.currentPauseWindow', {
    defaultValue: 'open until',
  });
  const windowEnd = new Date(current.window_ends_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full space-y-2">
      {pending ? (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-center text-[11px] leading-snug text-foreground/90">
          {t('library.pendingPauseHint', {
            defaultValue: 'New market context is queued — use the prompt on Home or here to switch or keep your current pause.',
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
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-nox-text-highlight">
              {t('library.currentPause', { defaultValue: 'Current pause' })}
            </p>
            {showWindowClock ? (
              <p className="text-[10px] font-mono text-muted-foreground">
                {windowLabel} {windowEnd}
              </p>
            ) : null}
          </div>
          {preview && (
            <p className="line-clamp-2 text-sm leading-relaxed text-foreground">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs font-medium text-nox-text-link">
            {t('library.openPauseCta', { defaultValue: 'Open pause' })}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </div>
        </div>
      </div>
    </motion.button>
    </div>
  );
}
