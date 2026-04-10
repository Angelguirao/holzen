import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  stagger: (delay: number) => object;
}

const DECISIONS = [
  { key: 'hold', emoji: '🪨' },
  { key: 'sell', emoji: '📤' },
  { key: 'buy', emoji: '📥' },
] as const;

type Phase = 'breathing' | 'reflection' | 'haiku' | 'decide' | 'done';

/** @deprecated Not used by the onboarding flow in `Onboarding.tsx`; retained for reference or future reuse. */
export function OnboardingDemo({ stagger }: Props) {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(prefersReduced ? 'reflection' : 'breathing');
  const [breathCount, setBreathCount] = useState(0);

  // Auto-advance phases
  useEffect(() => {
    if (prefersReduced) {
      setPhase('decide');
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];

    // breathing → reflection after 4s (2 breath cycles)
    timers.push(setTimeout(() => setPhase('reflection'), 4000));
    // reflection → haiku after 7s
    timers.push(setTimeout(() => setPhase('haiku'), 7500));
    // haiku → decide after 10.5s
    timers.push(setTimeout(() => setPhase('decide'), 11000));

    return () => timers.forEach(clearTimeout);
  }, [prefersReduced]);

  // Breath cycle counter
  useEffect(() => {
    if (phase !== 'breathing') return;
    const interval = setInterval(() => setBreathCount(c => c + 1), 2000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleDecide = useCallback((key: string) => {
    hapticFeedback('medium');
    setPhase('done');
  }, []);

  const fadeIn = prefersReduced
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.demoTitle')}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground leading-relaxed"
        {...stagger(0.15)}
      >
        {t('onboarding.demoIntro')}
      </motion.p>

      {/* Interactive mini-pause simulation */}
      <motion.div
        className="rounded-lg border border-border/30 bg-card/20 p-5 space-y-5 min-h-[260px]"
        {...stagger(0.25)}
      >
        {/* Context bar */}
        <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">
          {t('onboardingSample.context')}
        </p>

        <AnimatePresence mode="wait">
          {/* Phase: Breathing */}
          {phase === 'breathing' && (
            <motion.div
              key="breathing"
              className="flex flex-col items-center gap-4 py-4"
              {...fadeIn}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
            >
              <motion.div
                className="w-16 h-16 rounded-full border border-border/20"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <p className="text-[10px] font-mono text-muted-foreground/40 tracking-wider">
                {t('onboarding.inhaleHoldExhale')}
              </p>
            </motion.div>
          )}

          {/* Phase: Reflection */}
          {phase === 'reflection' && (
            <motion.div
              key="reflection"
              className="space-y-3"
              {...fadeIn}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
            >
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                {t('onboarding.demoReflectionLabel')}
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">
                {t('onboardingSample.message')}
              </p>
            </motion.div>
          )}

          {/* Phase: Haiku */}
          {phase === 'haiku' && (
            <motion.div
              key="haiku"
              className="space-y-3"
              {...fadeIn}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
            >
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                {t('onboarding.readAsHaiku')}
              </p>
              <p className="text-sm leading-relaxed text-foreground/70 italic whitespace-pre-line">
                {t('onboardingSample.haiku')}
              </p>
            </motion.div>
          )}

          {/* Phase: Decide */}
          {phase === 'decide' && (
            <motion.div
              key="decide"
              className="space-y-4"
              {...fadeIn}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider text-center">
                {t('pause.whatWillYouDo')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {DECISIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => handleDecide(d.key)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-md border border-border/20 bg-card/30 hover:bg-card/60 hover:border-border/40 transition-all duration-300"
                  >
                    <span className="text-lg">{d.emoji}</span>
                    <span className="text-[8px] font-mono text-foreground/50 tracking-wider uppercase">
                      {t(`ritual.decide.${d.key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase: Done */}
          {phase === 'done' && (
            <motion.div
              key="done"
              className="flex flex-col items-center gap-3 py-6"
              {...fadeIn}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl"
              >
                ✓
              </motion.div>
              <p className="text-sm text-foreground/70 text-center leading-relaxed">
                {t('onboarding.demoComplete')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.p
        className="text-[10px] text-muted-foreground/40"
        {...stagger(0.4)}
      >
        {t('onboarding.demoHint')}
      </motion.p>
    </div>
  );
}
