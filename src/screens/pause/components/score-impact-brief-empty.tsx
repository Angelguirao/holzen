import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type ScoreImpactBriefEmptyProps = {
  title: string;
  motionDelay: number;
  hideTitle?: boolean;
  className?: string;
};

/** Brief Done contribution block when `buildPauseScoreImpacts` returns no rows. */
export function ScoreImpactBriefEmpty({ title, motionDelay, hideTitle, className }: ScoreImpactBriefEmptyProps) {
  const { t } = useTranslation();

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
