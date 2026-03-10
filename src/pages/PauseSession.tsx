import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ArrowDown, Heart, Flame } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { CompanionSection, type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';
import { ReflectionNote } from '@/components/ReflectionNote';
import { ReflectionTags } from '@/components/ReflectionTags';
import { ShareReflection } from '@/components/ShareReflection';
import { ReflectionWallpaper } from '@/components/ReflectionWallpaper';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';

const DECISIONS = [
  { value: 'held', key: 'hold', emoji: '🪨' },
  { value: 'sold', key: 'sell', emoji: '📤' },
  { value: 'bought', key: 'buy', emoji: '📥' },
  { value: 'nothing', key: 'nothing', emoji: '🌿' },
] as const;

const STEPS = ['feel', 'ground', 'check', 'decide'] as const;
type Step = typeof STEPS[number];

function ProgressIndicator({ currentStep }: { currentStep: Step }) {
  const { t } = useTranslation();
  const stepLabels: Record<Step, string> = {
    feel: t('pause.steps.feel', 'Feel'),
    ground: t('pause.steps.ground', 'Ground'),
    check: t('pause.steps.check', 'Check'),
    decide: t('pause.steps.decide', 'Decide'),
  };

  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  isActive ? 'w-6 bg-primary/60' : isPast ? 'w-4 bg-primary/25' : 'w-4 bg-border/30'
                }`}
              />
              <span
                className={`text-[8px] font-mono uppercase tracking-[0.15em] transition-colors duration-500 ${
                  isActive ? 'text-primary/60' : isPast ? 'text-muted-foreground/30' : 'text-muted-foreground/15'
                }`}
              >
                {stepLabels[step]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.1);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.8, ease: 'easeOut' as const, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { mantra, dismissMessage } = useHolzen();
  const scrollRef = useRef<HTMLDivElement>(null);

  // State passed from Home
  const state = (location.state as any) ?? {};
  const message: string = state.reflectionMessage ?? '';
  const context: string | null = state.context ?? null;
  const reflectionId: string | null = state.reflectionId ?? null;
  const companions: CompanionData = state.companions ?? { haiku: null, learningTitle: null, learningBody: null };
  const companionPrefs: CompanionPrefs = state.companionPrefs ?? { breathing: true, haiku: true, learning: true, signal: true, zoomOut: true, history: true };
  const severity: 'mild' | 'moderate' | 'high' = state.severity ?? 'mild';

  const [phase, setPhase] = useState<'session' | 'done'>('session');
  const [decision, setDecision] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [moodDone, setMoodDone] = useState(false);
  const [moodAfterDone, setMoodAfterDone] = useState(false);
  const [curtainLifted, setCurtainLifted] = useState(false);

  // Derive current step from state
  const currentStep = useMemo<Step>(() => {
    if (!moodDone) return 'feel';
    if (!moodAfterDone) return 'ground'; // user is in grounding/companions phase
    return 'decide';
  }, [moodDone, moodAfterDone]);

  // Cinematic entrance
  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMoodSelect = useCallback(async (mood: MoodValue) => {
    hapticFeedback('light');
    setMoodDone(true);
    if (reflectionId) {
      await supabase.from('reflections').update({ mood } as any).eq('id', reflectionId);
    }
  }, [reflectionId]);

  const handleMoodSkip = useCallback(() => {
    setMoodDone(true);
  }, []);

  const handleMoodAfterSelect = useCallback(async (mood: MoodValue) => {
    hapticFeedback('light');
    setMoodAfterDone(true);
    if (reflectionId) {
      await supabase.from('reflections').update({ mood_after: mood } as any).eq('id', reflectionId);
    }
  }, [reflectionId]);

  const handleMoodAfterSkip = useCallback(() => {
    setMoodAfterDone(true);
  }, []);

  const { subscribed } = useSubscription();

  const toggleFavorite = useCallback(async () => {
    if (!reflectionId) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    hapticFeedback('light');
    await supabase.from('reflections').update({ is_favorite: newVal }).eq('id', reflectionId);
    await supabase.from('library_items').update({ is_favorite: newVal }).eq('reflection_id', reflectionId).eq('source_type', 'reflection');
    if (newVal && !subscribed) {
      toast(t('pause.favoriteProHint'), { duration: 4000 });
    }
  }, [reflectionId, isFavorite, subscribed, t]);

  const handleReturn = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleDecide = useCallback(async (d: string) => {
    hapticFeedback('medium');
    setDecision(d);
    dismissMessage();
    if (reflectionId) {
      await supabase.from('reflections').update({ outcome: d }).eq('id', reflectionId);
    }
    hapticFeedback('success');
    setPhase('done');
  }, [dismissMessage, reflectionId]);

  // If no message, redirect back
  if (!message && phase === 'session') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-sm font-mono text-muted-foreground">{t('pause.noReflection')}</p>
          <button onClick={handleReturn} className="text-xs font-mono text-primary underline">{t('pause.return')}</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dark curtain entrance */}
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[100] bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{
          background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
        }}
      >
        {/* Ambient orbs */}
        <motion.div
          className="fixed top-1/4 left-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={prefersReducedMotion ? {} : {
            x: [0, 30, -20, 0],
            y: [0, -20, 15, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="fixed bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={prefersReducedMotion ? {} : {
            x: [0, -25, 15, 0],
            y: [0, 20, -10, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Close button */}
        <button
          onClick={handleReturn}
          className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted/60 transition-all duration-300 z-[60]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress indicator — fixed at top */}
        {phase === 'session' && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[55]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <ProgressIndicator currentStep={currentStep} />
          </motion.div>
        )}

        <div ref={scrollRef} className="relative z-10 max-w-md mx-auto px-6 py-20 space-y-16">
          {phase === 'session' && (
            <>
              {/* Opening — breathing circle */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="flex flex-col items-center gap-6 pt-10"
              >
                <div className="relative">
                  <motion.div
                    className="w-20 h-20 rounded-full border border-border/10 relative cursor-pointer"
                    style={{
                      background: 'radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
                    }}
                    initial={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
                    animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1], opacity: 1 }}
                    transition={{
                      scale: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
                      opacity: { duration: 1.2, ease: 'easeOut' },
                    }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => {
                      hapticFeedback('light');
                      const circle = e.currentTarget;
                      const ripple = document.createElement('span');
                      ripple.className = 'absolute inset-0 rounded-full animate-ping';
                      ripple.style.background = 'hsl(var(--primary) / 0.06)';
                      circle.appendChild(ripple);
                      setTimeout(() => ripple.remove(), 700);
                    }}
                  />
                  <motion.div
                    className="absolute -inset-3 rounded-full border border-border/5 pointer-events-none"
                    animate={prefersReducedMotion ? {} : { scale: [1, 1.04, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-[11px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
                    {t('pause.youPaused')}
                  </p>
                  {mantra && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 1.5 }}
                      className="text-[11px] font-mono text-muted-foreground/25 italic text-center max-w-xs leading-relaxed"
                    >
                      "{mantra}"
                    </motion.p>
                  )}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 1 }}
                >
                  <ArrowDown className="h-3 w-3 text-muted-foreground/15 animate-bounce" />
                </motion.div>
              </motion.div>

              {/* Reflection message */}
              <RevealSection>
                <div className="space-y-4">
                  {context && (
                    <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em]">
                      {context}
                    </p>
                  )}
                  <p className="text-[17px] leading-[1.7] text-foreground/85 font-light">{message}</p>
                  <div className="flex items-center gap-0.5 pt-1">
                    <button
                      onClick={toggleFavorite}
                      className={`p-2 rounded-full transition-all duration-300 ${isFavorite ? 'text-destructive bg-destructive/5' : 'text-muted-foreground/25 hover:text-destructive/60 hover:bg-destructive/5'}`}
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <ShareReflection message={message} context={context} haiku={companions?.haiku} />
                    {subscribed && <ReflectionWallpaper message={message} mood={null} context={context} haiku={companions?.haiku} variant="button" />}
                  </div>
                </div>
              </RevealSection>

              {/* Note & tags */}
              {reflectionId && (
                <RevealSection>
                  <div className="space-y-4">
                    <ReflectionNote reflectionId={reflectionId} initialNote={null} />
                    <ReflectionTags reflectionId={reflectionId} initialTags={[]} />
                  </div>
                </RevealSection>
              )}

              {/* Mood check-in (before) */}
              {!moodDone && (
                <RevealSection>
                  <MoodCheck onSelect={handleMoodSelect} onSkip={handleMoodSkip} variant="before" />
                </RevealSection>
              )}

              {/* Companions — the grounding section */}
              <RevealSection>
                <CompanionSection
                  companions={companions}
                  prefs={companionPrefs}
                  severity={severity}
                  reflectionId={reflectionId}
                  context={context}
                  reflectionMessage={message}
                />
              </RevealSection>

              {/* Mood check-in (after grounding) */}
              {!moodAfterDone && (
                <RevealSection>
                  <MoodCheck onSelect={handleMoodAfterSelect} onSkip={handleMoodAfterSkip} variant="after" />
                </RevealSection>
              )}

              {/* Decision */}
              <RevealSection>
                <div className="space-y-5">
                  <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em] text-center">
                    {t('pause.whatWillYouDo')}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DECISIONS.map((d) => (
                      <motion.button
                        key={d.value}
                        onClick={() => handleDecide(d.value)}
                        whileTap={{ scale: 0.96 }}
                        className="flex flex-col items-center gap-2 py-5 rounded-xl border border-border/15 bg-card/20 backdrop-blur-sm hover:bg-card/40 hover:border-border/30 transition-all duration-300"
                      >
                        <span className="text-lg">{d.emoji}</span>
                        <span className="text-[10px] font-mono text-foreground/50 tracking-[0.12em] uppercase">
                          {t(`ritual.decide.${d.key}`)}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </RevealSection>

              {/* Bottom spacer */}
              <div className="h-16" />
            </>
          )}

          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center gap-10 pt-28 text-center"
            >
              {/* Streak flame celebration */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.4, 1], opacity: 1 }}
                  transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeOut' }}
                  className="w-18 h-18 rounded-full bg-primary/8 flex items-center justify-center"
                  style={{ width: 72, height: 72 }}
                >
                  <Flame className="h-7 w-7 text-primary/60" />
                </motion.div>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-primary/30"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos((i * Math.PI * 2) / 6) * 44,
                      y: Math.sin((i * Math.PI * 2) / 6) * 44,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex items-center gap-2"
              >
                <Flame className="h-3 w-3 text-primary/40" />
                <p className="text-[10px] font-mono text-muted-foreground/40 tracking-[0.15em] uppercase">
                  {t('outcome.streakUpdated')}
                </p>
              </motion.div>

              <div className="space-y-3">
                <p className="text-sm font-mono text-foreground/50">{t('pause.youChose')}</p>
                <p className="text-xs font-mono text-muted-foreground/30 capitalize">{decision}</p>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                onClick={handleReturn}
                className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-500 tracking-[0.15em] uppercase mt-4"
              >
                {t('pause.return')}
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
