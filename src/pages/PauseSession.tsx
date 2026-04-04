import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

import { PauseProgress, type PauseStep, STEPS } from '@/components/pause/PauseProgress';
import { PauseFeel } from '@/components/pause/PauseFeel';
import { PauseBreathing } from '@/components/pause/PauseBreathing';
import { PauseReflect } from '@/components/pause/PauseReflect';
import { PauseShift } from '@/components/pause/PauseShift';
import { PauseDecide } from '@/components/pause/PauseDecide';
import { PauseDone } from '@/components/pause/PauseDone';
import { PauseScienceSheet } from '@/components/pause/PauseScienceSheet';
import { holzenLog } from '@/lib/holzen-console';
import { parsePauseSessionLocationState } from '@/lib/router-location-state';

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
  selectedMood?: MoodValue | null;
  selectedMoodAfter?: MoodValue | null;
  phase: 'session' | 'done';
  decision: string | null;
  step: PauseStep;
}

const DEFAULT_COMPANIONS: CompanionData = { haiku: null, groundingTitle: null, groundingBody: null };
const DEFAULT_PREFS: CompanionPrefs = {
  breathing: true, haiku: true, grounding: true, signal: true, zoomOut: true, history: true,
};

interface FetchedReflectionRow {
  id: string;
  message: string;
  context: string | null;
  haiku: string | null;
  grounding_title: string | null;
  grounding_body: string | null;
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

function viewRowToCompanionData(row: {
  haiku?: string | null;
  grounding_title?: string | null;
  grounding_body?: string | null;
}): CompanionData {
  return {
    haiku: row.haiku ?? null,
    groundingTitle: row.grounding_title ?? null,
    groundingBody: row.grounding_body ?? null,
  };
}

type HydrationReady = {
  status: 'ready';
  message: string;
  context: string | null;
  reflectionId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
};

type HydrationState = HydrationReady | { status: 'fetch'; reflectionId: string } | { status: 'empty' };

export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const {
    mantra,
    dismissMessage,
    groundingActivities,
    message: holzenMessage,
    context: holzenContext,
    companions: holzenCompanions,
    lastReflectionId: holzenLastReflectionId,
    companionPrefs: holzenCompanionPrefs,
    severity: holzenSeverity,
    profileLoaded,
  } = useHolzen();
  const { subscribed } = useSubscription();

  const {
    reflectionId: navReflectionId,
    reflectionMessage: navReflectionMessage,
    context: navContext,
    companions: navCompanions,
    companionPrefs: navCompanionPrefs,
    severity: navSeverity,
  } = parsePauseSessionLocationState(location.state);

  const restored = useMemo(() => {
    const saved = loadSession();
    if (!saved?.message) return null;
    if (navReflectionId && saved.reflectionId && saved.reflectionId !== navReflectionId) return null;
    return saved;
  }, [location.key, navReflectionId]);

  const holzenAligned =
    !navReflectionId || (holzenLastReflectionId != null && holzenLastReflectionId === navReflectionId);

  const hydration = useMemo((): HydrationState => {
    if (restored?.message) {
      return {
        status: 'ready',
        message: restored.message,
        context: restored.context ?? null,
        reflectionId: restored.reflectionId ?? navReflectionId ?? holzenLastReflectionId,
        companions: restored.companions ?? holzenCompanions ?? DEFAULT_COMPANIONS,
        companionPrefs: restored.companionPrefs ?? holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: restored.severity ?? holzenSeverity,
      };
    }

    // Profile-backed hook: same reflection as router target (or no id in nav) — avoids stale nav text
    if (holzenMessage && holzenAligned) {
      return {
        status: 'ready',
        message: holzenMessage,
        context: holzenContext,
        reflectionId: holzenLastReflectionId,
        companions: holzenCompanions ?? DEFAULT_COMPANIONS,
        companionPrefs: holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: holzenSeverity,
      };
    }

    if (navReflectionMessage) {
      return {
        status: 'ready',
        message: navReflectionMessage,
        context: navContext ?? holzenContext,
        reflectionId: navReflectionId ?? holzenLastReflectionId,
        companions: navCompanions ?? holzenCompanions ?? DEFAULT_COMPANIONS,
        companionPrefs: navCompanionPrefs ?? holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: navSeverity ?? holzenSeverity,
      };
    }

    if (navReflectionId) {
      return { status: 'fetch', reflectionId: navReflectionId };
    }

    if (holzenMessage) {
      return {
        status: 'ready',
        message: holzenMessage,
        context: holzenContext,
        reflectionId: holzenLastReflectionId,
        companions: holzenCompanions ?? DEFAULT_COMPANIONS,
        companionPrefs: holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: holzenSeverity,
      };
    }

    return { status: 'empty' };
  }, [
    restored,
    holzenMessage,
    holzenContext,
    holzenLastReflectionId,
    holzenCompanions,
    holzenCompanionPrefs,
    holzenSeverity,
    holzenAligned,
    navReflectionId,
    navReflectionMessage,
    navContext,
    navCompanions,
    navCompanionPrefs,
    navSeverity,
  ]);

  const [fetchedRow, setFetchedRow] = useState<FetchedReflectionRow | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  const fetchReflectionId = hydration.status === 'fetch' ? hydration.reflectionId : null;

  useEffect(() => {
    if (!fetchReflectionId) {
      setFetchedRow(null);
      setFetchFailed(false);
      return;
    }
    let cancelled = false;
    setFetchedRow(null);
    setFetchFailed(false);
    void (async () => {
      const { data, error } = await supabase
        .from('v_reflection_with_companions')
        .select('id, message, context, haiku, grounding_title, grounding_body')
        .eq('id', fetchReflectionId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data?.message) {
        setFetchFailed(true);
        return;
      }
      setFetchedRow(data as FetchedReflectionRow);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchReflectionId]);

  const resolved: HydrationReady | null = useMemo(() => {
    if (hydration.status === 'ready') return hydration;
    if (hydration.status === 'fetch' && fetchedRow?.message) {
      return {
        status: 'ready',
        message: fetchedRow.message,
        context: fetchedRow.context ?? null,
        reflectionId: fetchedRow.id,
        companions: viewRowToCompanionData(fetchedRow),
        companionPrefs: navCompanionPrefs ?? holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: navSeverity ?? holzenSeverity,
      };
    }
    return null;
  }, [hydration, fetchedRow, navCompanionPrefs, holzenCompanionPrefs, navSeverity, holzenSeverity]);

  useEffect(() => {
    holzenLog.pause('mount', {
      reflectionIdPrefix: (fetchReflectionId ?? navReflectionId)?.slice(0, 8) ?? null,
      hasNavMessage: navReflectionMessage.length > 0,
      restoredFromStorage: restored !== null,
      hydrationStatus: hydration.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first paint of /pause only
  }, []);

  const message = resolved?.message ?? '';
  const context = resolved?.context ?? null;
  const reflectionId = resolved?.reflectionId ?? null;
  const companions = resolved?.companions ?? DEFAULT_COMPANIONS;
  const companionPrefs = resolved?.companionPrefs ?? DEFAULT_PREFS;
  const severity = resolved?.severity ?? holzenSeverity;

  const waitingForFetch = hydration.status === 'fetch' && !fetchFailed && !fetchedRow;

  // Map old step names to new ones for session restoration
  const mapStep = (s: string): PauseStep => {
    if (s === 'pause') return 'breathe';
    if (s === 'ground') return 'reflect';
    if (STEPS.includes(s as PauseStep)) return s as PauseStep;
    return 'breathe';
  };

  const [step, setStep] = useState<PauseStep>(mapStep(restored?.step ?? 'breathe'));
  const [phase, setPhase] = useState<'session' | 'done'>(restored?.phase ?? 'session');
  const [decision, setDecision] = useState<string | null>(restored?.decision ?? null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [moodDone, setMoodDone] = useState(restored?.moodDone ?? false);
  const [moodAfterDone, setMoodAfterDone] = useState(restored?.moodAfterDone ?? false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(restored?.selectedMood ?? null);
  const [selectedMoodAfter, setSelectedMoodAfter] = useState<MoodValue | null>(restored?.selectedMoodAfter ?? null);
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [pauseImpactData, setPauseImpactData] = useState<{
    mood: string | null; moodAfter: string | null; breathingCompleted: boolean;
    decision: string | null; context: string | null; engagedTools: number;
    wroteNote: boolean; usedTags: boolean;
  } | null>(null);

  // Persist session
  useEffect(() => {
    if (!message) return;
    saveSession({ message, context, reflectionId, companions, companionPrefs, severity, moodDone, moodAfterDone, selectedMood, selectedMoodAfter, phase, decision, step });
  }, [
    message,
    context,
    reflectionId,
    companions,
    companionPrefs,
    severity,
    moodDone,
    moodAfterDone,
    selectedMood,
    selectedMoodAfter,
    phase,
    decision,
    step,
  ]);

  // Cinematic entrance
  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track swipe direction for animation
  const [swipeDirection, setSwipeDirection] = useState<'forward' | 'back'>('forward');

  const goToStep = useCallback((next: PauseStep) => {
    const currentIndex = STEPS.indexOf(step);
    const nextIndex = STEPS.indexOf(next);
    setSwipeDirection(nextIndex >= currentIndex ? 'forward' : 'back');
    hapticFeedback('light');
    setStep(next);
  }, [step]);

  const goBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setSwipeDirection('back');
      hapticFeedback('light');
      setStep(STEPS[currentIndex - 1]);
    }
  }, [step]);

  const goForward = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      setSwipeDirection('forward');
      hapticFeedback('light');
      setStep(STEPS[currentIndex + 1]);
    }
  }, [step]);

  // Swipe handler
  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 50;
    const velocityThreshold = 300;
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      goForward();
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      goBack();
    }
  }, [goForward, goBack]);

  const handleMoodSelect = useCallback(async (mood: MoodValue) => {
    hapticFeedback('light');
    setMoodDone(true);
    setSelectedMood(mood);
    if (reflectionId) {
      await supabase.from('reflections').update({ mood } as any).eq('id', reflectionId);
    }
  }, [reflectionId]);

  const handleMoodSkip = useCallback(() => {
    setMoodDone(true);
  }, []);

  const handleMoodReset = useCallback(() => {
    setMoodDone(false);
    setSelectedMood(null);
  }, []);

  const handleMoodAfterSelect = useCallback(async (mood: MoodValue) => {
    hapticFeedback('light');
    setMoodAfterDone(true);
    setSelectedMoodAfter(mood);
    if (reflectionId) {
      await supabase.from('reflections').update({ mood_after: mood } as any).eq('id', reflectionId);
    }
  }, [reflectionId]);

  const handleMoodAfterSkip = useCallback(() => {
    setMoodAfterDone(true);
  }, []);

  const handleMoodAfterReset = useCallback(() => {
    setMoodAfterDone(false);
    setSelectedMoodAfter(null);
  }, []);

  const toggleFavorite = useCallback(async () => {
    if (!reflectionId) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    hapticFeedback('light');
    const [r1, r2] = await Promise.all([
      supabase.from('reflections').update({ is_favorite: newVal }).eq('id', reflectionId),
      supabase.from('library_items').update({ is_favorite: newVal }).eq('reflection_id', reflectionId).eq('source_type', 'reflection'),
    ]);
    if (r1.error || r2.error) {
      setIsFavorite(!newVal); // roll back optimistic update
      return;
    }
    if (newVal && !subscribed) {
      toast(t('pause.favoriteProHint'), { duration: 4000 });
    }
  }, [reflectionId, isFavorite, subscribed, t]);

  const handleClose = useCallback(() => {
    // Preserve session so user can resume later
    navigate('/', { replace: true });
  }, [navigate]);

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
    // Fetch final reflection state for score impact
    if (reflectionId) {
      const { data: ref } = await (supabase
        .from('v_reflection_with_companions')
        .select('zoom_out_read, history_read, signal_read, grounding_read, note, tags')
        .eq('id', reflectionId)
        .single() as any);
      if (ref) {
        const r = ref as { zoom_out_read?: boolean; history_read?: boolean; signal_read?: boolean; grounding_read?: boolean; note?: string | null; tags?: string[] | null };
        const tools = [r.zoom_out_read, r.history_read, r.signal_read, r.grounding_read].filter(Boolean).length;
        setPauseImpactData({
          mood: selectedMood,
          moodAfter: selectedMoodAfter,
          breathingCompleted: true, // they went through breathing step
          decision: d,
          context,
          engagedTools: tools,
          wroteNote: !!(r.note && r.note.length > 10),
          usedTags: !!(r.tags && r.tags.length > 0),
        });
      }
    }
    hapticFeedback('success');
    setPhase('done');
    clearSession();
  }, [dismissMessage, reflectionId, selectedMood, selectedMoodAfter, context]);

  // No message fallback
  if (!message && phase !== 'done') {
    if (waitingForFetch) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-sm font-mono text-muted-foreground">{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      );
    }

    if (hydration.status === 'fetch' && fetchFailed) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-sm px-4">
            <p className="text-sm font-mono text-muted-foreground">
              {t('pause.couldNotLoadPause', 'We could not load this pause. It may have been removed or you may need to sign in again.')}
            </p>
            <button type="button" onClick={handleReturn} className="text-xs font-mono text-primary underline">
              {t('pause.return')}
            </button>
          </div>
        </div>
      );
    }

    // Avoid "no reflection" while profile/hook may still supply the latest pause (direct /pause visit).
    if (!profileLoaded && hydration.status === 'empty') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-sm font-mono text-muted-foreground">{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-sm font-mono text-muted-foreground">{t('pause.noReflection')}</p>
          <button type="button" onClick={handleReturn} className="text-xs font-mono text-primary underline">{t('pause.return')}</button>
        </div>
      </div>
    );
  }

  const slideX = prefersReducedMotion ? 0 : 80;
  const stepTransition = {
    initial: { opacity: 0, x: swipeDirection === 'forward' ? slideX : -slideX },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: swipeDirection === 'forward' ? -slideX : slideX },
    transition: { duration: prefersReducedMotion ? 0.1 : 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  };

  const dragProps = {
    drag: 'x' as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.15,
    onDragEnd: handleDragEnd,
    dragDirectionLock: true,
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
          onClick={handleClose}
          className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted/60 transition-all duration-300 z-[60]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress indicator */}
        {phase === 'session' && (
          <motion.div
            className="fixed top-5 left-5 z-[55] flex flex-col items-start gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <PauseProgress currentStep={step} onStepClick={goToStep} />
            <PauseScienceSheet />
          </motion.div>
        )}

        <div className="relative z-10 max-w-md mx-auto px-6 py-20 overflow-hidden">
          {phase === 'session' && (
            <AnimatePresence mode="wait" initial={false}>
              {step === 'breathe' && (
                <motion.div key="breathe" {...stepTransition} {...dragProps}>
                  <PauseBreathing mantra={mantra} onContinue={() => goToStep('feel')} />
                </motion.div>
              )}

              {step === 'feel' && (
                <motion.div key="feel" {...stepTransition} {...dragProps}>
                  <PauseFeel
                    onMoodSelect={handleMoodSelect}
                    onMoodSkip={handleMoodSkip}
                    onMoodReset={handleMoodReset}
                    moodDone={moodDone}
                    selectedMood={selectedMood}
                    onContinue={() => goToStep('reflect')}
                    onBack={goBack}
                  />
                </motion.div>
              )}

              {step === 'reflect' && (
                <motion.div key="reflect" {...stepTransition} {...dragProps}>
                  <PauseReflect
                    companions={companions}
                    companionPrefs={companionPrefs}
                    severity={severity}
                    reflectionId={reflectionId}
                    context={context}
                    reflectionMessage={message}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    subscribed={subscribed}
                    onContinue={() => goToStep('shift')}
                    onBack={goBack}
                    mood={selectedMood}
                  />
                </motion.div>
              )}

              {step === 'shift' && (
                <motion.div key="shift" {...stepTransition} {...dragProps}>
                  <PauseShift
                    onMoodAfterSelect={handleMoodAfterSelect}
                    onMoodAfterSkip={handleMoodAfterSkip}
                    onMoodAfterReset={handleMoodAfterReset}
                    moodAfterDone={moodAfterDone}
                    selectedMoodAfter={selectedMoodAfter}
                    onContinue={() => goToStep('decide')}
                    onBack={goBack}
                    groundingActivities={groundingActivities}
                  />
                </motion.div>
              )}

              {step === 'decide' && (
                <motion.div key="decide" {...stepTransition} {...dragProps}>
                  <PauseDecide onDecide={handleDecide} onBack={goBack} />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {phase === 'done' && (
            <PauseDone decision={decision} onReturn={handleReturn} pauseData={pauseImpactData} />
          )}
        </div>
      </motion.div>
    </>
  );
}
