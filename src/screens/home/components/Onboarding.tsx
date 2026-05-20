import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OnboardingWhy } from '@/screens/home/components/onboarding/OnboardingWhy';
import { OnboardingReady } from '@/screens/home/components/onboarding/OnboardingReady';
import { useSubscription } from '@/features/subscription/public-hooks';
import { trackOnboardingCompleted } from '@/screens/home/lib/home-screen-telemetry';

interface OnboardingResult {
  threshold: number;
  firstName: string | null;
  timezone: string;
  motivations: string[];
  groundingActivities: string[];
}

interface OnboardingCompleteOptions {
  setLocalOnboarded?: boolean;
}

interface Props {
  onComplete: (result: OnboardingResult, options?: OnboardingCompleteOptions) => Promise<void> | void;
}

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const TOTAL_STEPS = 2;

export function Onboarding({ onComplete }: Props) {
  const { t } = useTranslation();
  const { ensureTrial, trialLoading } = useSubscription();
  const [step, setStep] = useState(0);
  const [timezone] = useState(detectedTimezone);
  const [motivations, setMotivations] = useState<string[]>([]);
  const [direction, setDirection] = useState(1);
  const [startingTrial, setStartingTrial] = useState(false);
  const prefersReduced = useReducedMotion();

  const goTo = useCallback((next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }, [step]);

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const variants = prefersReduced
    ? { enter: {}, center: {}, exit: {} }
    : {
        enter: (d: number) => ({ opacity: 0, y: d > 0 ? 40 : -40 }),
        center: { opacity: 1, y: 0 },
        exit: (d: number) => ({ opacity: 0, y: d > 0 ? -20 : 20 }),
      };

  const transition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.5, ease };

  const stagger = (delay: number) =>
    prefersReduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4, ease } };

  const toggleMotivation = useCallback((id: string) => {
    setMotivations((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }, []);

  const buildResult = useCallback(
    (): OnboardingResult => ({
      threshold: 5,
      firstName: null,
      timezone,
      motivations,
      groundingActivities: [],
    }),
    [timezone, motivations],
  );

  return (
    <motion.div className="fixed inset-0 z-[60] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <motion.div className="min-h-[460px] relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {step === 0 && (
                <OnboardingWhy
                  selected={motivations}
                  onToggle={toggleMotivation}
                  stagger={stagger}
                />
              )}

              {step === 1 && (
                <OnboardingReady
                  motivations={motivations}
                  onStartTrial={() => {
                    void (async () => {
                      setStartingTrial(true);
                      try {
                        await onComplete(buildResult(), { setLocalOnboarded: false });
                        await ensureTrial();
                        await onComplete(buildResult());
                        trackOnboardingCompleted(2);
                      } finally {
                        setStartingTrial(false);
                      }
                    })();
                  }}
                  trialLoading={trialLoading || startingTrial}
                  stagger={stagger}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="flex items-center justify-between mt-8"
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div className="flex items-center gap-2">
            {[...Array(TOTAL_STEPS)].map((_, i) => (
              <motion.div
                key={i}
                className="h-px bg-foreground"
                animate={{
                  width: i === step ? '1.5rem' : '0.75rem',
                  opacity: i <= step ? 1 : 0.15,
                }}
                transition={{ duration: 0.4, ease }}
              />
            ))}
            <span className="text-[10px] font-mono text-muted-foreground/40 ml-1.5">
              {step + 1}/{TOTAL_STEPS}
            </span>
          </motion.div>

          <motion.div className="flex items-center gap-3">
            {step === 0 && motivations.length === 0 ? (
              <button
                type="button"
                onClick={() => goTo(1)}
                className="text-[10px] font-mono text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                {t('common.skip')}
              </button>
            ) : null}
            {step > 0 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                ← {t('common.back')}
              </button>
            )}

            {step < TOTAL_STEPS - 1 && (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="text-[10px] font-mono text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                {t('common.continue')}
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
