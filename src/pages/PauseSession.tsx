import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { hapticFeedback } from '@/lib/haptics';
import { type MoodValue } from '@/components/MoodCheck';
import { type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';

import { type PauseStep, STEPS } from '@/components/pause/PauseProgress';
import { PauseSessionGate } from '@/components/pause/PauseSessionGate';
import { PauseSessionScaffold } from '@/components/pause/PauseSessionScaffold';
import { PauseFeel } from '@/components/pause/PauseFeel';
import { PauseBreathing } from '@/components/pause/PauseBreathing';
import { PauseReflect } from '@/components/pause/PauseReflect';
import { PauseShift } from '@/components/pause/PauseShift';
import { PauseDecide } from '@/components/pause/PauseDecide';
import { PauseDone } from '@/components/pause/PauseDone';
import { holzenLog } from '@/lib/holzen-console';
import { parsePauseSessionLocationState } from '@/lib/router-location-state';
import { logPauseStepIfV2 } from '@/lib/pause-step-logger';
import {
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  type FetchedReflectionRow,
  saveSession,
  loadSession,
  clearSession,
  viewRowToCompanionData,
} from '@/lib/pause-session-storage';

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
    lastPauseInstanceId: holzenLastPauseInstanceId,
    companionPrefs: holzenCompanionPrefs,
    severity: holzenSeverity,
    profileLoaded,
  } = useHolzen();
  const { subscribed, refresh: refreshSubscription } = useSubscription();

  const {
    reflectionId: navReflectionId,
    pauseInstanceId: navPauseInstanceId,
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
  // Pause V2 instance id. Resolution order:
  //   1. Navigation state (Bell + Library current-pause card, Phase F).
  //   2. Hook-aligned last manual pause (Phase D).
  // Handlers use this to log pause_step_events via the Phase B RPCs.
  const pauseInstanceId = navPauseInstanceId ?? holzenLastPauseInstanceId ?? null;

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
  const [breathingCompleted, setBreathingCompleted] = useState<boolean>(restored?.breathingCompleted ?? false);
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [pauseImpactData, setPauseImpactData] = useState<{
    mood: string | null; moodAfter: string | null; breathingCompleted: boolean;
    decision: string | null; context: string | null; engagedTools: number;
    wroteNote: boolean; usedTags: boolean;
  } | null>(null);

  // Persist session
  useEffect(() => {
    if (!message) return;
    saveSession({ message, context, reflectionId, companions, companionPrefs, severity, moodDone, moodAfterDone, selectedMood, selectedMoodAfter, phase, decision, step, breathingCompleted });
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
    breathingCompleted,
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
    void logPauseStepIfV2({
      pauseInstanceId,
      stepType: 'initial_emotion_logged',
      payload: { mood },
    });
  }, [reflectionId, pauseInstanceId]);

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
    void logPauseStepIfV2({
      pauseInstanceId,
      stepType: 'shift_emotion_logged',
      payload: { mood },
    });
  }, [reflectionId, pauseInstanceId]);

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
    void logPauseStepIfV2({
      pauseInstanceId,
      stepType: 'favorite_toggled',
      payload: { is_favorite: newVal },
    });
    if (newVal && !subscribed) {
      toast(t('pause.favoriteProHint'), { duration: 4000 });
    }
  }, [reflectionId, pauseInstanceId, isFavorite, subscribed, t]);

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
      // Outcome just flipped this row to an "engaged pause" — force a quota refetch so
      // PauseDone sees the up-to-date monthlyUsed and can render the `justHitLimit` upsell
      // for the pause that just crossed the free-tier threshold (instead of waiting for
      // the 5-min staleTime or window focus).
      void refreshSubscription();
    }
    void logPauseStepIfV2({
      pauseInstanceId,
      stepType: 'outcome_logged',
      payload: { outcome: d },
    });
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
          breathingCompleted,
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
  }, [dismissMessage, reflectionId, pauseInstanceId, selectedMood, selectedMoodAfter, context, breathingCompleted, refreshSubscription]);

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
    <PauseSessionGate
      hasMessage={!!message}
      phase={phase}
      waitingForFetch={waitingForFetch}
      fetchFailed={fetchFailed}
      hydrationStatus={hydration.status}
      profileLoaded={profileLoaded}
      onReturn={handleReturn}
    >
      <PauseSessionScaffold
        curtainLifted={curtainLifted}
        prefersReducedMotion={!!prefersReducedMotion}
        onClose={handleClose}
        phase={phase}
        step={step}
        goToStep={goToStep}
      >
        {phase === 'session' && (
          <AnimatePresence mode="wait" initial={false}>
            {step === 'breathe' && (
              <motion.div key="breathe" {...stepTransition} {...dragProps}>
                <PauseBreathing
                  mantra={mantra}
                  severity={severity}
                  completed={breathingCompleted}
                  onComplete={() => {
                    setBreathingCompleted(true);
                    void logPauseStepIfV2({
                      pauseInstanceId,
                      stepType: 'breath_completed',
                    });
                  }}
                  onContinue={() => goToStep('feel')}
                />
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
                  pauseInstanceId={pauseInstanceId}
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
      </PauseSessionScaffold>
    </PauseSessionGate>
  );
}
