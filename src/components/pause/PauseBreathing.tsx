import { useState, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/haptics';
import { getSessionQuote } from '@/lib/wisdom-quotes';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';

const PATTERNS = [
  {
    nameKey: 'breathing.patterns.box',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 4 },
      { labelKey: 'breathing.phases.exhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 4 },
    ],
  },
  {
    nameKey: 'breathing.patterns.calming',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 7 },
      { labelKey: 'breathing.phases.exhale', duration: 8 },
    ],
  },
  {
    nameKey: 'breathing.patterns.sigh',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 3 },
      { labelKey: 'breathing.phases.sip', duration: 1 },
      { labelKey: 'breathing.phases.exhale', duration: 6 },
    ],
  },
];

const EXPAND_KEYS = ['breathing.phases.inhale', 'breathing.phases.sip'];
const CONTRACT_KEYS = ['breathing.phases.exhale'];

export type PauseBreathingHandle = {
  /** Return from the timed breathing loop to the pre-start intro (same step). */
  resetToIntro: () => void;
};

export type PauseBreathSegment = 'first' | 'second';

interface Props {
  mantra: string | null;
  severity?: 'mild' | 'moderate' | 'high';
  /** First segment after Feel; second after Frame (Figma deep pause). */
  breathSegment?: PauseBreathSegment;
  /** After full breath cycles: interstitial → parent logs `breath_completed` then navigates onward. */
  onContinueAfterBreath: () => void;
  /** Intro or mid-pattern skip: leave breath without logging completion. */
  onSkipBreath: () => void | Promise<void>;
  completed?: boolean;
  /** Fires when timed cycles finish — parent may mark session “past pattern” for header chrome (no DB log yet). */
  onPatternComplete?: () => void;
  /** True while the countdown / phase loop is running (not intro, not completion card). */
  onTimedBreathingChange?: (active: boolean) => void;
}

export const PauseBreathing = forwardRef<PauseBreathingHandle, Props>(function PauseBreathing(
  {
    mantra,
    severity = 'mild',
    breathSegment = 'first',
    onContinueAfterBreath,
    onSkipBreath,
    completed: completedProp,
    onPatternComplete,
    onTimedBreathingChange,
  },
  ref,
) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const quote = useMemo(() => getSessionQuote(), []);

  const patternIndex = severity === 'high' ? 1 : 0;
  const pattern = PATTERNS[patternIndex];
  const totalCycles = breathSegment === 'second' ? 2 : 3;

  const [started, setStarted] = useState(!!completedProp);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [completedLocal, setCompletedLocal] = useState(!!completedProp);

  const completed = completedProp ?? completedLocal;
  const currentPhase = pattern.phases[phaseIndex];

  useImperativeHandle(
    ref,
    () => ({
      resetToIntro: () => {
        setStarted(false);
        setPhaseIndex(0);
        setElapsed(0);
        setCycle(0);
        setCompletedLocal(false);
      },
    }),
    [],
  );

  const inTimedLoop = started && !completed;
  useEffect(() => {
    onTimedBreathingChange?.(inTimedLoop);
  }, [inTimedLoop, onTimedBreathingChange]);

  useEffect(() => {
    if (!started || completed) return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= currentPhase.duration) {
          const nextPhase = phaseIndex + 1;
          if (nextPhase >= pattern.phases.length) {
            const nextCycle = cycle + 1;
            if (nextCycle >= totalCycles) {
              setCompletedLocal(true);
              onPatternComplete?.();
              hapticFeedback('success');
              return 0;
            }
            setCycle(nextCycle);
            setPhaseIndex(0);
          } else {
            setPhaseIndex(nextPhase);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [
    started,
    completed,
    phaseIndex,
    cycle,
    currentPhase.duration,
    pattern.phases.length,
    onPatternComplete,
    totalCycles,
  ]);

  const progress = currentPhase.duration > 0 ? elapsed / currentPhase.duration : 0;
  const isExpand = EXPAND_KEYS.includes(currentPhase.labelKey);
  const isContract = CONTRACT_KEYS.includes(currentPhase.labelKey);
  const scale = isExpand ? 0.5 + progress * 0.5 : isContract ? 1 - progress * 0.5 : 1;

  const introKicker =
    breathSegment === 'second'
      ? t('pause.breathIntroKickerSecond', { defaultValue: 'Step 5 · Breath' })
      : t('pause.breathIntroKickerFirst', { defaultValue: 'Step 2 · Breath' });

  const interstitialTitle =
    breathSegment === 'second'
      ? t('pause.breathInterstitialTitleSecond', { defaultValue: 'You stayed with it' })
      : t('pause.breathInterstitialTitle', { defaultValue: 'You stayed with it' });

  const interstitialBody =
    breathSegment === 'second'
      ? t('pause.breathInterstitialBodySecond', {
          defaultValue: 'When you are ready, continue to your decision.',
        })
      : t('pause.breathInterstitialBody', {
          defaultValue: 'When you are ready, continue into reflection.',
        });

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {!started ? (
        <>
          <motion.div
            className="h-24 w-24 rounded-full border border-border/10"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
            }}
            animate={prefersReduced ? {} : { scale: [1, 1.12, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{introKicker}</p>
            <p className={pauseStepLayout.screenTitle}>
              {breathSegment === 'second'
                ? t('pause.breathSecondHeadline', { defaultValue: "Let's slow this down again" })
                : t('pause.youPaused')}
            </p>
            {breathSegment === 'first' && mantra && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.5 }}
                className="max-w-sm text-sm italic leading-relaxed text-muted-foreground"
              >
                "{mantra}"
              </motion.p>
            )}
            {breathSegment === 'first' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: mantra ? 2.5 : 1.2, duration: 2 }}
                className="flex max-w-md flex-col items-center gap-2"
              >
                <p className="text-center text-sm italic leading-relaxed text-muted-foreground">"{quote.text}"</p>
                <p className="text-xs text-muted-foreground/80">— {quote.author}</p>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              onClick={() => {
                hapticFeedback('light');
                setStarted(true);
              }}
              className={pauseStepLayout.textContinue}
            >
              {t('breathing.begin', { defaultValue: 'Begin breathing' })}
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 1 }}
              type="button"
              onClick={() => {
                hapticFeedback('light');
                void onSkipBreath();
              }}
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t('common.skip')}
            </motion.button>
          </div>
        </>
      ) : !completed ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <motion.div
            className="rounded-full border-2 border-primary/20"
            style={{
              width: 140,
              height: 140,
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
            }}
            animate={{ scale }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
          <motion.p
            key={`${phaseIndex}-${cycle}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-editorial text-2xl capitalize text-foreground sm:text-3xl"
          >
            {t(currentPhase.labelKey)}
          </motion.p>
          <p className="font-mono text-3xl tabular-nums text-muted-foreground">
            {currentPhase.duration - elapsed}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {cycle + 1} / {totalCycles}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <div className="h-20 w-20 rounded-full border border-primary/15 bg-primary/5" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('pause.breathYouAreHere', { defaultValue: "You're here" })}
          </p>
          <p className="text-center font-editorial text-2xl text-foreground sm:text-3xl">{interstitialTitle}</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{interstitialBody}</p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onClick={() => {
              hapticFeedback('light');
              onContinueAfterBreath();
            }}
            className={pauseStepLayout.textContinue}
          >
            {t('pause.steps.continue', { defaultValue: 'Continue' })}
          </motion.button>
        </motion.div>
      )}

      {!completed && started && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          type="button"
          onClick={() => {
            hapticFeedback('light');
            void onSkipBreath();
          }}
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t('common.skip')}
        </motion.button>
      )}
    </motion.div>
  );
});
