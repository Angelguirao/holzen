import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public-session';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
export type PauseBreathSegment = 'first' | 'second';

export type PauseBreathIntroProps = {
  breathSegment: PauseBreathSegment;
  ritualVariant: 'brief' | 'deep';
  prefersReducedMotion: boolean;
  onStart: () => void;
  /** Deep second segment only — omit on brief and deep first breathe. */
  onSkipBreath?: () => void | Promise<void>;
};

/** Pre-start breath ritual intro (first/second segment copy, start/skip CTAs). */
export function PauseBreathIntro({
  breathSegment,
  ritualVariant,
  prefersReducedMotion,
  onStart,
  onSkipBreath,
}: PauseBreathIntroProps) {
  "use memo";
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
          <div className="flex max-w-md flex-col items-center gap-2 text-center">
            <p className="max-w-md text-center font-editorial text-[1.375rem] leading-7 tracking-wide text-foreground">
              {t('pause.breathSecondHeadline', { defaultValue: 'Final breath' })}
            </p>
            <p className="max-w-md text-center text-base leading-6 tracking-wide text-foreground">
              {t('pause.breathSecondSubline', {
                defaultValue: "A breath to settle what you've moved through",
              })}
            </p>
          </div>
        ) : (
          <p className={`${pauseStepLayout.screenTitle} max-w-md`}>
            {t('pause.breathIntroSingle', {
              defaultValue: "Let's slow this down. Just follow the rhythm.",
            })}
          </p>
        )}
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
        {ritualVariant === 'deep' && breathSegment === 'second' && onSkipBreath ? (
          <Button
            type="button"
            variant="ghost"
            className="text-sm font-medium tracking-wide text-primary hover:bg-transparent hover:text-primary/90"
            onClick={() => {
              hapticFeedback('light');
              void onSkipBreath();
            }}
          >
            {t('pause.breathContinueWithoutFinalBreath', {
              defaultValue: 'Continue without final breath',
            })}
          </Button>
        ) : null}
      </div>
    </>
  );
}
