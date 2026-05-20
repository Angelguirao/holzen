import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
export type PauseBreathSegment = 'first' | 'second';

export type PauseBreathIntroProps = {
  breathSegment: PauseBreathSegment;
  mantra: string | null;
  ritualVariant: 'brief' | 'deep';
  prefersReducedMotion: boolean;
  onStart: () => void;
  onSkipBreath: () => void | Promise<void>;
};

/** Pre-start breath ritual intro (first/second segment copy, mantra, start/skip CTAs). */
export function PauseBreathIntro({
  breathSegment,
  mantra,
  ritualVariant,
  prefersReducedMotion,
  onStart,
  onSkipBreath,
}: PauseBreathIntroProps) {
  const { t } = useTranslation();
  const introKicker = t('pause.breathIntroKickerRitual', { defaultValue: 'Breathe' });

  return (
    <>
      <motion.div
        className="h-24 w-24 rounded-full border border-border/10"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
        }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.12, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        {breathSegment === 'second' ? null : (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {introKicker}
          </p>
        )}
        {breathSegment === 'second' ? (
          <>
            <p className={pauseStepLayout.screenTitle}>
              {t('pause.breathSecondHeadline', { defaultValue: 'Just two more breaths' })}
            </p>
            <div className={`${pauseStepLayout.screenSubtitle} flex flex-col gap-0`}>
              <p>{t('pause.breathSecondSubline1', { defaultValue: 'Decisions land differently' })}</p>
              <p>{t('pause.breathSecondSubline2', { defaultValue: 'when the body is here.' })}</p>
            </div>
          </>
        ) : (
          <p className={`${pauseStepLayout.screenTitle} max-w-md`}>
            {t('pause.breathIntroSingle', {
              defaultValue: "Let's slow this down. Just follow the rhythm.",
            })}
          </p>
        )}
        {breathSegment === 'first' && mantra ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="max-w-sm text-sm italic leading-relaxed text-muted-foreground"
          >
            {`"${mantra}"`}
          </motion.p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <Button
            type="button"
            variant="outline"
            size="default"
            className={pauseStepLayout.ritualPrimaryOutlineCta}
            onClick={() => {
              hapticFeedback('light');
              onStart();
            }}
          >
            {t('pause.breathStartCta', { defaultValue: 'Start' })}
            <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden />
          </Button>
        </motion.div>
        {ritualVariant === 'deep' && breathSegment === 'second' ? (
          <Button
            type="button"
            variant="ghost"
            className={`${pauseStepLayout.textContinue} font-medium`}
            onClick={() => {
              hapticFeedback('light');
              void onSkipBreath();
            }}
          >
            {t('pause.breathSkipToDecide', { defaultValue: 'Skip to decide' })}
          </Button>
        ) : null}
      </div>
    </>
  );
}
