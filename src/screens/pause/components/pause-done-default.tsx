import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public';
import { useSubscription } from '@/features/subscription/public-hooks';
import { Button } from '@/components/ui/button';
import { ScoreImpact } from '@/screens/pause/components/ScoreImpact';
import { PauseDoneDefaultReinforcementCard } from '@/screens/pause/components/pause-done-default-reinforcement-card';
import { PauseDoneDefaultStreakHero } from '@/screens/pause/components/pause-done-default-streak-hero';
import { PauseDoneReflectShareRow } from '@/screens/pause/components/pause-done-reflect-share-row';
import type { PauseDonePauseData } from '@/screens/pause/components/pause-done-types';
import { resolveDoneWallpaperMood } from '@/screens/pause/lib/resolve-done-wallpaper-mood';

export type PauseDoneDefaultProps = {
  decision: string | null;
  onReturn: () => void;
  pauseData?: PauseDonePauseData | null;
  pauseInstanceId?: string | null;
};

/** Deep / default pause completion screen (streak celebration, score impact, return CTA). */
export function PauseDoneDefault({ decision, onReturn, pauseData, pauseInstanceId }: PauseDoneDefaultProps) {
  const { t } = useTranslation();
  const { subscribed } = useSubscription();
  const wallpaperMood = resolveDoneWallpaperMood(pauseData);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={pauseStepLayout.columnDone}
    >
      <PauseDoneDefaultStreakHero decision={decision} />

      {pauseData?.reinforcementQuote ? (
        <PauseDoneDefaultReinforcementCard quote={pauseData.reinforcementQuote} />
      ) : null}

      {pauseData ? <ScoreImpact data={pauseData} /> : null}

      <PauseDoneReflectShareRow
        subscribed={subscribed}
        reflectionMessage={pauseData?.reflectionMessage}
        context={pauseData?.context}
        haiku={pauseData?.haiku}
        wallpaperMood={wallpaperMood}
        pauseInstanceId={pauseInstanceId}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="mt-4"
      >
        <Button type="button" variant="default" className={pauseStepLayout.ritualPrimaryCta} onClick={onReturn}>
          {t('pause.return')}
        </Button>
      </motion.div>
    </motion.div>
  );
}
