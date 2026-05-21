import { motion } from 'framer-motion';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public-hooks';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { BreathOrbVisual } from '@/screens/pause/components/breath-orb-visual';

export type DeepBreathPostPatternSegment = 'first' | 'second';

export type DeepBreathPostPatternInterstitialProps = {
  segment: DeepBreathPostPatternSegment;
  prefersReducedMotion: boolean;
  onContinueAfterBreath: () => void;
  onRepeatPattern?: () => void;
};

/** Deep ritual post-pattern card between timed breath cycles and the next step. */
export function DeepBreathPostPatternInterstitial({
  segment,
  prefersReducedMotion,
  onContinueAfterBreath,
  onRepeatPattern,
}: DeepBreathPostPatternInterstitialProps) {
  const { t } = useTranslation();
  const isFirst = segment === 'first';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex max-w-md flex-col items-center gap-6 px-2 text-center"
    >
      {!isFirst ? (
        <motion.div
          className="flex shrink-0 items-center justify-center"
          animate={prefersReducedMotion ? {} : { scale: [1, 1.04, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BreathOrbVisual
            orbScale={1}
            phaseProgress={1}
            showHoldMandala
            holdProgress={1}
            prefersReducedMotion={prefersReducedMotion}
          />
        </motion.div>
      ) : null}
      <p className={pauseStepLayout.screenTitle}>
        {isFirst
          ? t('pause.deep.breathFirstInterstitialTitle', { defaultValue: 'Three breaths' })
          : t('pause.deep.breathSecondInterstitialTitle', { defaultValue: 'You already know' })}
      </p>
      {isFirst ? (
        <p className={`${pauseStepLayout.screenSubtitle} max-w-sm`}>
          {t('pause.deep.breathFirstInterstitialBody', { defaultValue: "You've arrived" })}
        </p>
      ) : null}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:gap-6"
      >
        {onRepeatPattern ? (
          <Button
            type="button"
            variant="ghost"
            className="gap-2 font-semibold text-primary hover:bg-primary/5 hover:text-primary"
            onClick={() => {
              hapticFeedback('light');
              onRepeatPattern();
            }}
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            {isFirst
              ? t('pause.deep.breathFirstRepeatCta', { defaultValue: 'Three more' })
              : t('pause.deep.breathSecondRepeatCta', { defaultValue: 'Three more' })}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="default"
          className={pauseStepLayout.ritualPrimaryOutlineCta}
          onClick={() => {
            hapticFeedback('light');
            onContinueAfterBreath();
          }}
        >
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
          <ChevronRight className="ml-1 h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </motion.div>
    </motion.div>
  );
}
