import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isPauseMoodValue, pauseStepLayout } from '@/features/pause/public';
import { useSubscription } from '@/features/subscription/public-hooks';
import { Button } from '@/components/ui/button';
import { ScoreImpact } from '@/screens/pause/components/ScoreImpact';
import { PauseDoneReflectShareRow } from '@/screens/pause/components/pause-done-reflect-share-row';
import type { PauseDonePauseData } from '@/screens/pause/components/pause-done-types';

export type PauseDoneDefaultProps = {
  decision: string | null;
  onReturn: () => void;
  pauseData?: PauseDonePauseData | null;
  pauseInstanceId?: string | null;
  subscribed: boolean;
};

/** Deep / default pause completion screen (streak celebration, score impact, return CTA). */
export function PauseDoneDefault({
  decision,
  onReturn,
  pauseData,
  pauseInstanceId,
  subscribed,
}: PauseDoneDefaultProps) {
  const { t } = useTranslation();

  const wallpaperMood =
    pauseData?.moodAfter && isPauseMoodValue(pauseData.moodAfter)
      ? pauseData.moodAfter
      : pauseData?.mood && isPauseMoodValue(pauseData.mood)
        ? pauseData.mood
        : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={pauseStepLayout.columnDone}
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: 1 }}
          transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeOut' }}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-nox-text-highlight/12"
        >
          <Flame className="h-7 w-7 text-muted-foreground" />
        </motion.div>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-nox-text-highlight/35"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 6) * 44,
              y: Math.sin((i * Math.PI * 2) / 6) * 44,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex items-center gap-2"
      >
        <Flame className="h-4 w-4 text-nox-text-highlight" />
        <p className="text-sm font-medium text-muted-foreground">{t('outcome.streakUpdated')}</p>
      </motion.div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t('pause.youChose')}</p>
        <p className="font-editorial text-2xl capitalize text-foreground">{decision}</p>
      </div>

      {pauseData?.reinforcementQuote ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="w-full max-w-md rounded-2xl border border-border/60 bg-card/50 px-5 py-6 text-center shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('pause.done.reinforcementKicker', { defaultValue: 'Carry this with you' })}
          </p>
          <p className="mt-3 font-editorial text-lg leading-snug text-foreground sm:text-xl">
            {pauseData.reinforcementQuote}
          </p>
        </motion.div>
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
