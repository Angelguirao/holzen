import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { hapticFeedback } from '@/lib/haptics';
import { type MoodValue } from '@/components/MoodCheck';
import { type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';

import { PauseProgress, type PauseStep } from '@/components/pause/PauseProgress';
import { PauseHeader } from '@/components/pause/PauseHeader';
import { PauseBreathing } from '@/components/pause/PauseBreathing';
import { PauseReflect } from '@/components/pause/PauseReflect';
import { PauseGround } from '@/components/pause/PauseGround';
import { PauseDecide } from '@/components/pause/PauseDecide';
import { PauseDone } from '@/components/pause/PauseDone';

const SESSION_KEY = 'holzen_pause_session';

interface PersistedSession {
  message: string;
  context: string | null;
  reflectionId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  moodDone: boolean;
  moodAfterDone: boolean;
  phase: 'session' | 'done';
  decision: string | null;
  step: PauseStep;
}

function saveSession(data: PersistedSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}

function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { mantra, dismissMessage } = useHolzen();
  const { subscribed } = useSubscription();

  const navState = (location.state as any) ?? {};
  const restored = useMemo(() => {
    if (navState.reflectionMessage) return null;
    return loadSession();
  }, []);

  const message: string = navState.reflectionMessage ?? restored?.message ?? '';
  const context: string | null = navState.context ?? restored?.context ?? null;
  const reflectionId: string | null = navState.reflectionId ?? restored?.reflectionId ?? null;
  const companions: CompanionData = navState.companions ?? restored?.companions ?? { haiku: null, learningTitle: null, learningBody: null };
  const companionPrefs: CompanionPrefs = navState.companionPrefs ?? restored?.companionPrefs ?? { breathing: true, haiku: true, learning: true, signal: true, zoomOut: true, history: true };
  const severity: 'mild' | 'moderate' | 'high' = navState.severity ?? restored?.severity ?? 'mild';

  const [step, setStep] = useState<PauseStep>(restored?.step ?? 'pause');
  const [phase, setPhase] = useState<'session' | 'done'>(restored?.phase ?? 'session');
  const [decision, setDecision] = useState<string | null>(restored?.decision ?? null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [moodDone, setMoodDone] = useState(restored?.moodDone ?? false);
  const [moodAfterDone, setMoodAfterDone] = useState(restored?.moodAfterDone ?? false);
  const [curtainLifted, setCurtainLifted] = useState(false);

  // Persist session
  useEffect(() => {
    if (!message) return;
    saveSession({ message, context, reflectionId, companions, companionPrefs, severity, moodDone, moodAfterDone, phase, decision, step });
  }, [message, moodDone, moodAfterDone, phase, decision, step]);

  // Cinematic entrance
  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const goToStep = useCallback((next: PauseStep) => {
    hapticFeedback('light');
    setStep(next);
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
    clearSession();
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
    clearSession();
  }, [dismissMessage, reflectionId]);

  // No message fallback
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

  const stepTransition = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: prefersReducedMotion ? 0.1 : 0.5 },
  };

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
          animate={prefersReducedMotion ? {} : { x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="fixed bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={prefersReducedMotion ? {} : { x: [0, -25, 15, 0], y: [0, 20, -10, 0] }}
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

        {/* Progress indicator */}
        {phase === 'session' && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[55]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <PauseProgress currentStep={step} />
          </motion.div>
        )}

        <div className="relative z-10 max-w-md mx-auto px-6 py-20">
          {phase === 'session' && (
            <>
              {/* Persistent header — visible after Pause step */}
              {step !== 'pause' && (
                <motion.div
                  className="mb-8 pb-6 border-b border-border/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <PauseHeader
                    message={message}
                    context={context}
                    haiku={companions?.haiku ?? null}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    subscribed={subscribed}
                  />
                </motion.div>
              )}

              {/* Step content */}
              <AnimatePresence mode="wait">
                {step === 'pause' && (
                  <motion.div key="pause" {...stepTransition}>
                    <PauseBreathing mantra={mantra} onContinue={() => goToStep('reflect')} />
                  </motion.div>
                )}

                {step === 'reflect' && (
                  <motion.div key="reflect" {...stepTransition}>
                    <PauseReflect
                      reflectionId={reflectionId}
                      message={message}
                      onMoodSelect={handleMoodSelect}
                      onMoodSkip={handleMoodSkip}
                      moodDone={moodDone}
                      onContinue={() => goToStep('ground')}
                    />
                  </motion.div>
                )}

                {step === 'ground' && (
                  <motion.div key="ground" {...stepTransition}>
                    <PauseGround
                      companions={companions}
                      companionPrefs={companionPrefs}
                      severity={severity}
                      reflectionId={reflectionId}
                      context={context}
                      reflectionMessage={message}
                      moodAfterDone={moodAfterDone}
                      onMoodAfterSelect={handleMoodAfterSelect}
                      onMoodAfterSkip={handleMoodAfterSkip}
                      onContinue={() => goToStep('decide')}
                    />
                  </motion.div>
                )}

                {step === 'decide' && (
                  <motion.div key="decide" {...stepTransition}>
                    <PauseDecide onDecide={handleDecide} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {phase === 'done' && (
            <PauseDone decision={decision} onReturn={handleReturn} />
          )}
        </div>
      </motion.div>
    </>
  );
}
