import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PauseImpactData } from '@/features/pause/public';
import {
  buildPauseScoreImpacts,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
} from '@/features/pause/public-hooks';
import { ScoreImpactBriefEmpty } from '@/screens/pause/components/score-impact-brief-empty';
import { ScoreImpactRowList } from '@/screens/pause/components/score-impact-row-list';

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

  const impacts = useMemo(() => buildPauseScoreImpacts(data, t, variant), [data, t, variant]);
  const displayImpacts = useMemo(
    () => resolveScoreImpactDisplayImpacts(impacts, excludeFirstFromList),
    [impacts, excludeFirstFromList],
  );
  const viewMode = useMemo(
    () => resolveScoreImpactViewMode({ impacts, variant, excludeFirstFromList }),
    [impacts, variant, excludeFirstFromList],
  );
  const motionDelay = scoreImpactMotionDelaySec(variant);

  const title =
    variant === 'brief'
      ? t('pause.brief.done.contributionTitle', { defaultValue: 'How this pause contributes' })
      : t('scoreImpact.title', { defaultValue: 'Score impact' });

  if (viewMode === 'hidden') return null;

  if (viewMode === 'brief_empty') {
    return (
      <ScoreImpactBriefEmpty
        title={title}
        motionDelay={motionDelay}
        hideTitle={hideTitle}
        className={className}
      />
    );
  }

  if (viewMode === 'brief_hidden') return null;

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
      <ScoreImpactRowList impacts={displayImpacts} />
    </motion.div>
  );
}
