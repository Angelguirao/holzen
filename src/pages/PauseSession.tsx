import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hapticFeedback } from '@/lib/haptics';
import { HolzenRitual, type RitualTemplate } from '@/components/HolzenRitual';
import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';

type Phase = 'landing' | 'ritual' | 'decide' | 'done';

const DECISIONS = [
  { value: 'held', emoji: '🪨' },
  { value: 'sold', emoji: '📤' },
  { value: 'bought', emoji: '📥' },
  { value: 'nothing', emoji: '🌿' },
] as const;

export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { ritualTemplate, mantra } = useHolzen();

  const reflectionMessage = (location.state as any)?.reflectionMessage ?? undefined;
  const reflectionId = (location.state as any)?.reflectionId ?? null;

  const [phase, setPhase] = useState<Phase>('landing');
  const [decision, setDecision] = useState<string | null>(null);

  // Auto-advance from landing after a breath
  useEffect(() => {
    if (phase !== 'landing') return;
    const timer = setTimeout(() => {}, 0); // no auto-advance, user controls
    return () => clearTimeout(timer);
  }, [phase]);

  const handleStartRitual = useCallback(() => {
    hapticFeedback('light');
    setPhase('ritual');
  }, []);

  const handleSkipToDecision = useCallback(() => {
    hapticFeedback('light');
    setPhase('decide');
  }, []);

  const handleRitualClose = useCallback(() => {
    setPhase('decide');
  }, []);

  const handleRitualDecision = useCallback((d: string) => {
    setDecision(d);
    setPhase('done');
  }, []);

  const handleDecide = useCallback((d: string) => {
    hapticFeedback('medium');
    setDecision(d);
    setPhase('done');
  }, []);

  const handleReturn = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const fadeIn = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: 'easeOut' as const } };

  const slowFade = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.2, ease: 'easeOut' as const } };

  return (
    <>
      <AnimatePresence>
        {phase !== 'ritual' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
            }}
          >
            {/* Soft floating orbs */}
            <motion.div
              className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
                filter: 'blur(80px)',
              }}
              animate={prefersReducedMotion ? {} : {
                x: [0, 30, -20, 0],
                y: [0, -20, 15, 0],
                scale: [1, 1.1, 0.95, 1],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.05) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
              animate={prefersReducedMotion ? {} : {
                x: [0, -25, 15, 0],
                y: [0, 20, -10, 0],
                scale: [1, 0.9, 1.05, 1],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Close */}
            <button
              onClick={handleReturn}
              className="absolute top-6 right-6 p-2 text-muted-foreground/30 hover:text-foreground/60 transition-colors duration-500 z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 w-full max-w-sm mx-auto px-6">
              <AnimatePresence mode="wait">
                {/* LANDING PHASE */}
                {phase === 'landing' && (
                  <motion.div
                    key="landing"
                    {...fadeIn}
                    exit={{ opacity: 0, y: -12 }}
                    className="flex flex-col items-center gap-10 text-center"
                  >
                    {/* Breathing circle */}
                    <motion.div
                      className="w-24 h-24 rounded-full border border-border/20"
                      style={{
                        background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
                      }}
                      animate={prefersReducedMotion ? {} : {
                        scale: [1, 1.15, 1],
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    <div className="space-y-3">
                      <motion.p
                        {...slowFade}
                        className="text-sm font-mono text-foreground/80 leading-relaxed"
                      >
                        {t('pause.youPaused')}
                      </motion.p>
                      {mantra && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 1.5 }}
                          className="text-xs font-mono text-muted-foreground/50 italic"
                        >
                          "{mantra}"
                        </motion.p>
                      )}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5, duration: 1 }}
                      className="flex flex-col items-center gap-3 w-full"
                    >
                      <button
                        onClick={handleStartRitual}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-500"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary/50" />
                        <span className="text-[11px] font-mono text-primary/60 tracking-[0.12em] uppercase">
                          {t('pause.startRitual')}
                        </span>
                      </button>

                      <button
                        onClick={handleSkipToDecision}
                        className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-500"
                      >
                        {t('pause.skipToDecision')}
                        <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {/* DECIDE PHASE */}
                {phase === 'decide' && (
                  <motion.div
                    key="decide"
                    {...fadeIn}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-8 text-center"
                  >
                    <p className="text-xs font-mono text-muted-foreground/60 tracking-wider uppercase">
                      {t('pause.whatWillYouDo')}
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      {DECISIONS.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => handleDecide(d.value)}
                          className="flex flex-col items-center gap-2 py-5 rounded-lg border border-border/30 bg-card/50 hover:bg-card hover:border-border/60 transition-all duration-300"
                        >
                          <span className="text-xl">{d.emoji}</span>
                          <span className="text-[10px] font-mono text-foreground/70 tracking-wider uppercase">
                            {t(`ritual.decide.${d.value === 'held' ? 'hold' : d.value === 'sold' ? 'sell' : d.value === 'bought' ? 'buy' : 'nothing'}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* DONE PHASE */}
                {phase === 'done' && (
                  <motion.div
                    key="done"
                    {...fadeIn}
                    className="flex flex-col items-center gap-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Check className="h-6 w-6 text-primary/70" />
                    </motion.div>

                    <div className="space-y-2">
                      <p className="text-sm font-mono text-foreground/70">
                        {t('pause.youChose')}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground/50 capitalize">
                        {decision}
                      </p>
                    </div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5, duration: 1 }}
                      onClick={handleReturn}
                      className="text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-500 tracking-[0.15em] uppercase"
                    >
                      {t('pause.return')}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ritual overlay */}
      <HolzenRitual
        open={phase === 'ritual'}
        onClose={handleRitualClose}
        template={(ritualTemplate || 'standard') as RitualTemplate}
        reflectionMessage={reflectionMessage}
        reflectionId={reflectionId}
        onDecision={handleRitualDecision}
      />
    </>
  );
}
