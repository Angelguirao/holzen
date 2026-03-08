import { useState, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, ArrowDown, Check, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { CompanionSection, type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';
import { ReflectionNote } from '@/components/ReflectionNote';
import { ReflectionTags } from '@/components/ReflectionTags';
import { ShareReflection } from '@/components/ShareReflection';
import { ReflectionWallpaper } from '@/components/ReflectionWallpaper';
import { OutcomePrompt } from '@/components/OutcomePrompt';

const DECISIONS = [
  { value: 'held', key: 'hold', emoji: '🪨' },
  { value: 'sold', key: 'sell', emoji: '📤' },
  { value: 'bought', key: 'buy', emoji: '📥' },
  { value: 'nothing', key: 'nothing', emoji: '🌿' },
] as const;

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
  const { ritualTemplate, mantra, dismissMessage } = useHolzen();
  const scrollRef = useRef<HTMLDivElement>(null);

  // State passed from Home
  const state = (location.state as any) ?? {};
  const message: string = state.reflectionMessage ?? '';
  const context: string | null = state.context ?? null;
  const reflectionId: string | null = state.reflectionId ?? null;
  const companions: CompanionData = state.companions ?? { haiku: null, learningTitle: null, learningBody: null };
  const companionPrefs: CompanionPrefs = state.companionPrefs ?? { breathing: true, haiku: true, learning: true, signal: true, zoomOut: true, history: true };
  const severity: 'mild' | 'moderate' | 'high' = state.severity ?? 'mild';

  const [phase, setPhase] = useState<'session' | 'outcome' | 'done'>('session');
  const [decision, setDecision] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = useCallback(async () => {
    if (!reflectionId) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    hapticFeedback('light');
    await supabase.from('reflections').update({ is_favorite: newVal }).eq('id', reflectionId);
    await supabase.from('library_items').update({ is_favorite: newVal }).eq('reflection_id', reflectionId).eq('source_type', 'reflection');
  }, [reflectionId, isFavorite]);

  const handleReturn = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleDecide = useCallback((d: string) => {
    hapticFeedback('medium');
    setDecision(d);
    // Dismiss the reflection from Home state
    dismissMessage();
    setPhase('outcome');
  }, [dismissMessage]);


  const handleOutcomeComplete = useCallback(() => {
    setPhase('done');
  }, []);

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
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
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

            {/* Close */}
            <button
              onClick={handleReturn}
              className="fixed top-6 right-6 p-2 text-muted-foreground/30 hover:text-foreground/60 transition-colors duration-500 z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div ref={scrollRef} className="relative z-10 max-w-md mx-auto px-6 py-20 space-y-16">
              {phase === 'session' && (
                <>
                  {/* Opening space */}
                  <motion.div
                    initial={prefersReducedMotion ? {} : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="flex flex-col items-center gap-6 pt-8"
                  >
                    {/* Breathing circle */}
                    <motion.div
                      className="w-20 h-20 rounded-full border border-border/15 relative cursor-pointer"
                      style={{
                        background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
                      }}
                      initial={prefersReducedMotion ? {} : { scale: 0, opacity: 0 }}
                      animate={prefersReducedMotion ? {} : { scale: [1, 1.12, 1], opacity: 1 }}
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
                        ripple.style.background = 'hsl(var(--primary) / 0.08)';
                        circle.appendChild(ripple);
                        setTimeout(() => ripple.remove(), 700);
                      }}
                    />
                    <p className="text-xs font-mono text-muted-foreground/40 tracking-wider">
                      {t('pause.youPaused')}
                    </p>
                    {mantra && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1.5 }}
                        className="text-[11px] font-mono text-muted-foreground/30 italic text-center max-w-xs"
                      >
                        "{mantra}"
                      </motion.p>
                    )}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2, duration: 1 }}
                    >
                      <ArrowDown className="h-3 w-3 text-muted-foreground/20 animate-bounce" />
                    </motion.div>
                  </motion.div>

                  {/* Reflection */}
                  <RevealSection>
                    <div className="space-y-4">
                      {context && (
                        <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">
                          {context}
                        </p>
                      )}
                      <p className="text-lg leading-relaxed text-foreground/90">{message}</p>
                      <div className="flex items-center gap-1">
                        <ShareReflection message={message} context={context} haiku={companions?.haiku} />
                        <ReflectionWallpaper message={message} mood={null} context={context} haiku={companions?.haiku} variant="button" />
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

                  {/* Companions */}
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


                  {/* Decision */}
                  <RevealSection>
                    <div className="space-y-4">
                      <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider text-center">
                        {t('pause.whatWillYouDo')}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {DECISIONS.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => handleDecide(d.value)}
                            className="flex flex-col items-center gap-2 py-5 rounded-lg border border-border/20 bg-card/30 hover:bg-card/60 hover:border-border/40 transition-all duration-300"
                          >
                            <span className="text-xl">{d.emoji}</span>
                            <span className="text-[10px] font-mono text-foreground/60 tracking-wider uppercase">
                              {t(`ritual.decide.${d.key}`)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </RevealSection>

                  {/* Bottom spacer */}
                  <div className="h-20" />
                </>
              )}

              {phase === 'outcome' && reflectionId && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="pt-16"
                >
                  <OutcomePrompt reflectionId={reflectionId} onComplete={handleOutcomeComplete} />
                </motion.div>
              )}

              {(phase === 'done' || (phase === 'outcome' && !reflectionId)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="flex flex-col items-center gap-8 pt-24 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' as const }}
                    className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <Check className="h-6 w-6 text-primary/60" />
                  </motion.div>

                  <div className="space-y-2">
                    <p className="text-sm font-mono text-foreground/60">{t('pause.youChose')}</p>
                    <p className="text-xs font-mono text-muted-foreground/40 capitalize">{decision}</p>
                  </div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    onClick={handleReturn}
                    className="text-[10px] font-mono text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors duration-500 tracking-[0.15em] uppercase"
                  >
                    {t('pause.return')}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
  );
}
