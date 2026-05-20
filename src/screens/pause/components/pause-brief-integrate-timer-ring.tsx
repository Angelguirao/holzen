import { useTranslation } from 'react-i18next';
import {
  BRIEF_INTEGRATE_RING_CIRC,
  BRIEF_INTEGRATE_RING_R,
  briefIntegrateRemainingProgress,
  briefIntegrateRingDashOffset,
} from '@/features/pause/public';

export type PauseBriefIntegrateTimerRingProps = {
  remaining: number;
  done: boolean;
};

/** Brief integrate step countdown ring (20s default). */
export function PauseBriefIntegrateTimerRing({ remaining, done }: PauseBriefIntegrateTimerRingProps) {
  const { t } = useTranslation();
  const integrateHint = t('pause.brief.integrate.hint', { defaultValue: '' }).trim();
  const progress = briefIntegrateRemainingProgress(remaining, done);
  const dashOffset = briefIntegrateRingDashOffset(progress);

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={BRIEF_INTEGRATE_RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-border/70"
        />
        <circle
          cx="60"
          cy="60"
          r={BRIEF_INTEGRATE_RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={BRIEF_INTEGRATE_RING_CIRC}
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
  );
}
