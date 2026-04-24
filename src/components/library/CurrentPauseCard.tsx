import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrentPause } from '@/hooks/use-current-pause';

/**
 * Library's "Current pause" card. Renders only while the caller has an
 * active or engaged pause (one at a time per user, enforced by the DB
 * partial unique index). Tapping it navigates to `/pause` with the
 * instance id in navigation state so PauseSession hydrates directly.
 *
 * Hidden entirely when:
 *   - pause_v2_enabled=false (flag not flipped yet in this environment)
 *   - user has no open pause
 *
 * Below this card, Library's existing history list continues to render
 * everything non-active as before.
 */
export function CurrentPauseCard() {
  const { loaded, current } = useCurrentPause();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!loaded) return null;
  if (!current) return null;

  const preview =
    current.reflection_message?.slice(0, 120) ??
    (typeof current.context_snapshot?.context_text === 'string'
      ? (current.context_snapshot.context_text as string).slice(0, 120)
      : '');

  const windowLabel = t('library.currentPauseWindow', {
    defaultValue: 'open until',
  });
  const windowEnd = new Date(current.window_ends_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
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
      className="w-full rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4 text-left transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label={t('library.openCurrentPause', {
        defaultValue: 'Open your current pause',
      })}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-primary/15 p-2 text-primary">
          <Pause className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('library.currentPause', { defaultValue: 'Current pause' })}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              {windowLabel} {windowEnd}
            </p>
          </div>
          {preview && (
            <p className="line-clamp-2 text-sm leading-relaxed text-foreground">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            {t('library.openPauseCta', { defaultValue: 'Open pause' })}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
