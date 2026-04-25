import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/haptics';
import { getSessionQuote } from '@/lib/wisdom-quotes';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';

type Phase = { labelKey: string; duration: number };

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
const TOTAL_CYCLES = 3;

interface Props {
  mantra: string | null;
  severity?: 'mild' | 'moderate' | 'high';
  onContinue: () => void;
  completed?: boolean;
  onComplete?: () => void;
}

export function PauseBreathing({ mantra, severity = 'mild', onContinue, completed: completedProp, onComplete }: Props) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const quote = useMemo(() => getSessionQuote(), []);

  const patternIndex = severity === 'high' ? 1 : 0;
  const pattern = PATTERNS[patternIndex];

  const [started, setStarted] = useState(!!completedProp);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [completedLocal, setCompletedLocal] = useState(!!completedProp);

  const completed = completedProp ?? completedLocal;
  const currentPhase = pattern.phases[phaseIndex];

  // Timer
  useEffect(() => {
    if (!started || completed) return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= currentPhase.duration) {
          const nextPhase = phaseIndex + 1;
          if (nextPhase >= pattern.phases.length) {
            const nextCycle = cycle + 1;
            if (nextCycle >= TOTAL_CYCLES) {
              setCompletedLocal(true);
              onComplete?.();
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
  }, [started, completed, phaseIndex, cycle, currentPhase.duration, pattern.phases.length, onComplete]);

  const progress = currentPhase.duration > 0 ? elapsed / currentPhase.duration : 0;
  const isExpand = EXPAND_KEYS.includes(currentPhase.labelKey);
  const isContract = CONTRACT_KEYS.includes(currentPhase.labelKey);
  const scale = isExpand ? 0.5 + progress * 0.5 : isContract ? 1 - progress * 0.5 : 1;

  // Auto-show continue after completion
  const showContinue = completed;

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {!started ? (
        /* Pre-start: breathing circle invitation */
        <>
          <motion.div
            className="w-24 h-24 rounded-full border border-border/10"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
            }}
            animate={prefersReduced ? {} : { scale: [1, 1.12, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <p className={pauseStepLayout.screenTitle}>
              {t('pause.youPaused')}
            </p>
            {mantra && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.5 }}
                className="max-w-sm text-sm italic leading-relaxed text-muted-foreground"
              >
                "{mantra}"
              </motion.p>
            )}
            {/* Wisdom quote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: mantra ? 2.5 : 1.2, duration: 2 }}
              className="flex max-w-md flex-col items-center gap-2"
            >
              <p className="text-center text-sm italic leading-relaxed text-muted-foreground">
                "{quote.text}"
              </p>
              <p className="text-xs text-muted-foreground/80">
                — {quote.author}
              </p>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            onClick={() => { hapticFeedback('light'); setStarted(true); }}
            className={pauseStepLayout.textContinue}
          >
            {t('breathing.begin', { defaultValue: 'Begin breathing' })}
          </motion.button>
        </>
      ) : !completed ? (
        /* Active breathing */
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
            {cycle + 1} / {TOTAL_CYCLES}
          </p>
        </motion.div>
      ) : (
        /* Completed */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="w-20 h-20 rounded-full border border-primary/15 bg-primary/5" />
          <p className="text-center font-editorial text-2xl text-foreground sm:text-3xl">
            {t('breathing.settled', { defaultValue: 'Settled' })}
          </p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onClick={() => { hapticFeedback('light'); onContinue(); }}
            className={pauseStepLayout.textContinue}
          >
            {t('pause.steps.continue', { defaultValue: 'Continue' })}
          </motion.button>
        </motion.div>
      )}

      {/* Skip option — always available */}
      {!completed && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: started ? 3 : 4, duration: 1 }}
          onClick={() => { hapticFeedback('light'); onContinue(); }}
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t('common.skip')}
        </motion.button>
      )}
    </motion.div>
  );
}
