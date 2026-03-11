import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/haptics';

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
}

export function PauseBreathing({ mantra, severity = 'mild', onContinue }: Props) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const patternIndex = severity === 'high' ? 1 : 0;
  const pattern = PATTERNS[patternIndex];

  const [started, setStarted] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [completed, setCompleted] = useState(false);

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
              setCompleted(true);
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
  }, [started, completed, phaseIndex, cycle, currentPhase.duration, pattern.phases.length]);

  const progress = currentPhase.duration > 0 ? elapsed / currentPhase.duration : 0;
  const isExpand = EXPAND_KEYS.includes(currentPhase.labelKey);
  const isContract = CONTRACT_KEYS.includes(currentPhase.labelKey);
  const scale = isExpand ? 0.5 + progress * 0.5 : isContract ? 1 - progress * 0.5 : 1;

  // Auto-show continue after completion
  const showContinue = completed;

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
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

          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-[11px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
              {t('pause.youPaused')}
            </p>
            {mantra && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.5 }}
                className="text-[11px] font-mono text-muted-foreground/25 italic max-w-xs leading-relaxed"
              >
                "{mantra}"
              </motion.p>
            )}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            onClick={() => { hapticFeedback('light'); setStarted(true); }}
            className="text-[10px] font-mono text-primary/50 hover:text-primary/70 transition-colors duration-500 tracking-[0.15em] uppercase"
          >
            {t('breathing.begin', 'Begin breathing')}
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
            className="text-sm font-mono text-muted-foreground/60 capitalize"
          >
            {t(currentPhase.labelKey)}
          </motion.p>
          <p className="text-[10px] font-mono text-muted-foreground/30">
            {currentPhase.duration - elapsed}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/20">
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
          <p className="text-[11px] font-mono text-muted-foreground/40 tracking-[0.15em] uppercase">
            {t('breathing.settled', 'Settled')}
          </p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onClick={() => { hapticFeedback('light'); onContinue(); }}
            className="text-[10px] font-mono text-primary/50 hover:text-primary/70 transition-colors duration-500 tracking-[0.15em] uppercase"
          >
            {t('pause.steps.continue', 'Continue')}
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
          className="text-[9px] font-mono text-muted-foreground/15 hover:text-muted-foreground/30 transition-colors duration-500 tracking-[0.12em] uppercase"
        >
          {t('common.skip')}
        </motion.button>
      )}
    </motion.div>
  );
}
