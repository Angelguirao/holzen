import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PauseImpactData } from '@/features/pause/public';
import { buildPauseScoreImpacts } from '@/features/pause/public';

export function ScoreImpact({
  data,
  variant = 'default',
  className,
  hideTitle = false,
  excludeFirstFromList = false,
}: {
  data: PauseImpactData;
  variant?: 'default' | 'brief';
  className?: string;
  hideTitle?: boolean;
  /** When true with `variant="brief"`, the first qualitative row is omitted (e.g. shown in a meta row above). */
  excludeFirstFromList?: boolean;
}) {
  const { t } = useTranslation();

  const impacts = useMemo(
    () => buildPauseScoreImpacts(data, t, variant),
    [data, t, variant],
  );

  const sliced = excludeFirstFromList ? impacts.slice(1) : impacts;
  /** Brief uses the same qualitative rows as default — no illustrative +N chips (see brief done + `computePauseScore` preview). */
  const displayImpacts = sliced;

  const motionDelay = variant === 'brief' ? 0.25 : 0.8;

  if (impacts.length === 0 && variant !== 'brief') return null;

  const title =
    variant === 'brief'
      ? t('pause.brief.done.contributionTitle', { defaultValue: 'How this pause contributes' })
      : t('scoreImpact.title', { defaultValue: 'Score impact' });

  if (impacts.length === 0 && variant === 'brief') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: motionDelay, duration: 0.45 }}
        className={cn('w-full space-y-2', className)}
      >
        {!hideTitle ? (
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        ) : null}
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          {t('pause.brief.done.contributionFallback', {
            defaultValue: 'This pause is now part of your Journey.',
          })}
        </p>
      </motion.div>
    );
  }

  if (variant === 'brief' && excludeFirstFromList && impacts.length > 0 && displayImpacts.length === 0) {
    return null;
  }

  if (variant === 'brief' && displayImpacts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: motionDelay, duration: 0.6 }}
      className={cn('w-full max-w-sm space-y-3', variant === 'brief' && 'max-w-none', className)}
    >
      {!hideTitle ? (
        <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      ) : null}
      <div className="space-y-2.5">
        {displayImpacts.map((imp) => (
          <div key={imp.key} className="flex items-start gap-2.5">
            {imp.direction === 'up' ? (
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-nox-accent-green" />
            ) : (
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1 text-left text-sm leading-snug">
              <span className="font-medium text-foreground">{imp.label}</span>
              <span className="text-muted-foreground"> — {imp.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
