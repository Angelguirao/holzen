import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Sparkles } from 'lucide-react';
import { pauseStepLayout } from '@/features/pause/public';
import { cn } from '@/lib/utils';

const INTEGRATE_SECONDS = 20;
const R = 54;
const CIRC = 2 * Math.PI * R;

interface Props {
  done: boolean;
  onComplete: () => void;
  onRepeatBreaths: () => void;
  onSwitchToDeepPause: () => void;
  /** When true, deep switch is gated (same product rule as depth picker). */
  deepPauseLocked: boolean;
}

export function PauseBriefIntegrate({
  done,
  onComplete,
  onRepeatBreaths,
  onSwitchToDeepPause,
  deepPauseLocked,
}: Props) {
  const { t } = useTranslation();
  const integrateHint = t('pause.brief.integrate.hint', { defaultValue: '' }).trim();
  const [remaining, setRemaining] = useState(INTEGRATE_SECONDS);
  const autoFired = useRef(false);

  useEffect(() => {
    if (done) {
      setRemaining(0);
      return;
    }
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (done || remaining > 0 || autoFired.current) return;
    autoFired.current = true;
    onComplete();
  }, [remaining, done, onComplete]);

  const progress = done ? 0 : remaining / INTEGRATE_SECONDS;
  const dashOffset = CIRC * (1 - progress);

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className={pauseStepLayout.screenTitle}>{t('pause.brief.integrate.title')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('pause.brief.integrate.line1')}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('pause.brief.integrate.line2')}</p>
        </div>

        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-border/70"
            />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="relative z-[1] flex flex-col items-center">
            <p className="font-mono text-3xl font-medium tabular-nums text-foreground">
              {done ? '0' : Math.max(0, remaining)}
              <span className="text-base text-muted-foreground">s</span>
            </p>
            {integrateHint ? (
              <p className="mt-1 max-w-[9rem] text-[11px] leading-snug text-muted-foreground">{integrateHint}</p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              autoFired.current = true;
              onRepeatBreaths();
            }}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            {t('pause.brief.integrate.repeatBreaths')}
          </button>
          <button
            type="button"
            disabled={deepPauseLocked}
            title={
              deepPauseLocked
                ? t('pause.depthPicker.deep.proRequiredHint', { defaultValue: 'Pro or free trial' })
                : undefined
            }
            onClick={() => {
              if (deepPauseLocked) return;
              autoFired.current = true;
              onSwitchToDeepPause();
            }}
            className={cn(
              'flex items-center justify-center gap-2 text-sm font-semibold transition-opacity',
              deepPauseLocked ? 'cursor-not-allowed text-muted-foreground opacity-60' : 'text-primary hover:opacity-90',
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            {t('pause.brief.integrate.switchDeep')}
          </button>
          {deepPauseLocked ? (
            <p className="text-center text-xs text-muted-foreground">{t('pause.brief.integrate.switchDeepLockedHint')}</p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
