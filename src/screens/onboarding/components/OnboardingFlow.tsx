import { useCallback, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  normalizeTrackedAssetId,
} from '@/features/market/public';
import { trackOnboardingCompleted } from '@/features/pause/public-home';
import { OnboardingAssetStep } from '@/screens/onboarding/components/OnboardingAssetStep';
import { OnboardingSubscriptionStep } from '@/screens/onboarding/components/OnboardingSubscriptionStep';
import { OnboardingThresholdStep } from '@/screens/onboarding/components/OnboardingThresholdStep';

interface OnboardingDraft {
  trackedAssetId: string;
  thresholdUp: number;
  thresholdDown: number;
  cumulativeThreshold: number;
  timezone: string;
}

interface Props {
  initialTrackedAssetId: string;
  initialThresholdUp: number;
  initialThresholdDown: number;
  initialCumulativeThreshold: number;
  onSaveDraft: (draft: OnboardingDraft) => Promise<void>;
  onStartTrial: () => Promise<void>;
  onComplete: () => Promise<void>;
  trialLoading: boolean;
}

const TOTAL_STEPS = 3;
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function OnboardingFlow({
  initialTrackedAssetId,
  initialThresholdUp,
  initialThresholdDown,
  initialCumulativeThreshold,
  onSaveDraft,
  onStartTrial,
  onComplete,
  trialLoading,
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [trackedAssetId, setTrackedAssetId] = useState(
    normalizeTrackedAssetId(initialTrackedAssetId || 'bitcoin'),
  );
  const [thresholdUp, setThresholdUp] = useState(initialThresholdUp || 5);
  const [thresholdDown, setThresholdDown] = useState(initialThresholdDown || initialThresholdUp || 5);
  const [cumulativeThreshold, setCumulativeThreshold] = useState(initialCumulativeThreshold || 15);
  const [isStartingTrial, startTrialFlow] = useTransition();

  const goTo = useCallback((next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }, [step]);

  const buildDraft = useCallback(
    (): OnboardingDraft => ({
      trackedAssetId: normalizeTrackedAssetId(trackedAssetId),
      thresholdUp,
      thresholdDown,
      cumulativeThreshold,
      timezone: detectedTimezone,
    }),
    [trackedAssetId, thresholdUp, thresholdDown, cumulativeThreshold],
  );

  const handleStartTrial = useCallback(() => {
    startTrialFlow(async () => {
      try {
        const draft = buildDraft();
        await onSaveDraft(draft);
        await onStartTrial();
        await onComplete();
        trackOnboardingCompleted({
          stepsCompleted: TOTAL_STEPS,
          trackedAssetId: draft.trackedAssetId,
          thresholdUp: draft.thresholdUp,
          thresholdDown: draft.thresholdDown,
        });
      } catch {
        // Profile writes and trial-start errors surface their own toast copy.
      }
    });
  }, [buildDraft, onComplete, onSaveDraft, onStartTrial]);

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
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.4, ease },
        };

  return (
    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <motion.div className="relative min-h-[460px]">
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
              {step === 0 ? (
                <OnboardingAssetStep
                  trackedAssetId={trackedAssetId}
                  onSelect={setTrackedAssetId}
                  stagger={stagger}
                />
              ) : null}

              {step === 1 ? (
                <OnboardingThresholdStep
                  trackedAssetId={trackedAssetId}
                  thresholdUp={thresholdUp}
                  onThresholdUpChange={setThresholdUp}
                  thresholdDown={thresholdDown}
                  onThresholdDownChange={setThresholdDown}
                  cumulativeThreshold={cumulativeThreshold}
                  onCumulativeThresholdChange={setCumulativeThreshold}
                  stagger={stagger}
                />
              ) : null}

              {step === 2 ? (
                <OnboardingSubscriptionStep
                  trackedAssetId={trackedAssetId}
                  thresholdUp={thresholdUp}
                  thresholdDown={thresholdDown}
                  onStartTrial={handleStartTrial}
                  trialLoading={trialLoading || isStartingTrial}
                  stagger={stagger}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="mt-8 flex items-center justify-between"
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
            <span className="ml-1.5 text-[10px] font-mono text-muted-foreground/40">
              {step + 1}/{TOTAL_STEPS}
            </span>
          </motion.div>

          <motion.div className="flex items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="text-[10px] font-mono text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                ← {t('common.back')}
              </button>
            ) : null}

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="text-[10px] font-mono text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {t('common.continue')}
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
