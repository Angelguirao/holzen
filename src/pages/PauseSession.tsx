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
import {
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  type FetchedPauseInstance,
  saveSession,
  loadSession,
  clearSession,
  companionDataFromArtifacts,
} from '@/lib/pause-session-storage';
import { pauseLogStep } from '@/lib/pause-api';

type HydrationReady = {
  status: 'ready';
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
};

type HydrationState = HydrationReady | { status: 'fetch'; pauseInstanceId: string } | { status: 'empty' };

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
    lastPauseInstanceId: holzenLastPauseInstanceId,
    companionPrefs: holzenCompanionPrefs,
    severity: holzenSeverity,
    profileLoaded,
  } = useHolzen();
  const { subscribed, refresh: refreshSubscription } = useSubscription();

  const {
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
    if (navPauseInstanceId && saved.pauseInstanceId && saved.pauseInstanceId !== navPauseInstanceId) return null;
    return saved;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on location.key + navPauseInstanceId; loadSession is a stable module import
  }, [location.key, navPauseInstanceId]);

  const holzenAligned =
    !navPauseInstanceId || (holzenLastPauseInstanceId != null && holzenLastPauseInstanceId === navPauseInstanceId);

  const hydration = useMemo((): HydrationState => {
    if (restored?.message) {
      return {
        status: 'ready',
        message: restored.message,
        context: restored.context ?? null,
        pauseInstanceId: restored.pauseInstanceId ?? navPauseInstanceId ?? holzenLastPauseInstanceId,
        companions: restored.companions ?? holzenCompanions ?? DEFAULT_COMPANIONS,
        companionPrefs: restored.companionPrefs ?? holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: restored.severity ?? holzenSeverity,
      };
    }

    if (holzenMessage && holzenAligned) {
      return {
        status: 'ready',
        message: holzenMessage,
        context: holzenContext,
        pauseInstanceId: holzenLastPauseInstanceId,
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
        pauseInstanceId: navPauseInstanceId ?? holzenLastPauseInstanceId,
        companions: navCompanions ?? holzenCompanions ?? DEFAULT_COMPANIONS,
        companionPrefs: navCompanionPrefs ?? holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: navSeverity ?? holzenSeverity,
      };
    }

    if (navPauseInstanceId) {
      return { status: 'fetch', pauseInstanceId: navPauseInstanceId };
    }

    if (holzenMessage) {
      return {
        status: 'ready',
        message: holzenMessage,
        context: holzenContext,
        pauseInstanceId: holzenLastPauseInstanceId,
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
    holzenLastPauseInstanceId,
    holzenCompanions,
    holzenCompanionPrefs,
    holzenSeverity,
    holzenAligned,
    navPauseInstanceId,
    navReflectionMessage,
    navContext,
    navCompanions,
    navCompanionPrefs,
    navSeverity,
  ]);

  const [fetchedInstance, setFetchedInstance] = useState<FetchedPauseInstance | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  const fetchPauseInstanceId = hydration.status === 'fetch' ? hydration.pauseInstanceId : null;

  useEffect(() => {
    if (!fetchPauseInstanceId) {
      setFetchedInstance(null);
      setFetchFailed(false);
      return;
    }
    let cancelled = false;
    setFetchedInstance(null);
    setFetchFailed(false);
    void (async () => {
      try {
        const { data: inst, error: instError } = await supabase
          .from('pause_instances' as never)
          .select('id, context_snapshot')
          .eq('id', fetchPauseInstanceId)
          .maybeSingle();
        if (cancelled) return;
        if (instError || !inst) {
          setFetchFailed(true);
          return;
        }
        const { data: artifacts, error: artifactsError } = await supabase
          .from('pause_ai_artifacts' as never)
          .select('kind, content')
          .eq('pause_instance_id', fetchPauseInstanceId);
        if (cancelled) return;
        if (artifactsError) {
          setFetchFailed(true);
          return;
        }
        const artifactRows = ((artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>);
        const companionData = companionDataFromArtifacts(artifactRows);
        const reflectionArt = artifactRows.find((a) => a.kind === 'reflection_text');
        const msg = typeof reflectionArt?.content?.message === 'string' ? (reflectionArt.content.message as string) : '';
        const ctxSnap = (inst as { context_snapshot: Record<string, unknown> | null }).context_snapshot ?? {};
        const ctx = typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;
        setFetchedInstance({
          id: fetchPauseInstanceId,
          reflection_message: msg,
          context: ctx,
          haiku: companionData.haiku,
          grounding_title: companionData.groundingTitle,
          grounding_body: companionData.groundingBody,
        });
      } catch {
        if (!cancelled) setFetchFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPauseInstanceId]);

  const resolved: HydrationReady | null = useMemo(() => {
    if (hydration.status === 'ready') return hydration;
    if (hydration.status === 'fetch' && fetchedInstance?.reflection_message) {
      return {
        status: 'ready',
        message: fetchedInstance.reflection_message,
        context: fetchedInstance.context ?? null,
        pauseInstanceId: fetchedInstance.id,
        companions: {
          haiku: fetchedInstance.haiku,
          groundingTitle: fetchedInstance.grounding_title,
          groundingBody: fetchedInstance.grounding_body,
        },
        companionPrefs: navCompanionPrefs ?? holzenCompanionPrefs ?? DEFAULT_PREFS,
        severity: navSeverity ?? holzenSeverity,
      };
    }
    return null;
  }, [hydration, fetchedInstance, navCompanionPrefs, holzenCompanionPrefs, navSeverity, holzenSeverity]);

  useEffect(() => {
    holzenLog.pause('mount', {
      pauseInstanceIdPrefix: (fetchPauseInstanceId ?? navPauseInstanceId)?.slice(0, 8) ?? null,
      hasNavMessage: navReflectionMessage.length > 0,
      restoredFromStorage: restored !== null,
      hydrationStatus: hydration.status,
    });
    // Intentional mount-only snapshot; listing deps would re-log on every navigation/hydration change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once diagnostic
  }, []);

  const message = resolved?.message ?? '';
  const context = resolved?.context ?? null;
  const pauseInstanceId = resolved?.pauseInstanceId ?? null;
  const companions = resolved?.companions ?? DEFAULT_COMPANIONS;
  const companionPrefs = resolved?.companionPrefs ?? DEFAULT_PREFS;
  const severity = resolved?.severity ?? holzenSeverity;

  const waitingForFetch = hydration.status === 'fetch' && !fetchFailed && !fetchedInstance;

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
    mood: string | null;
    moodAfter: string | null;
    breathingCompleted: boolean;
    decision: string | null;
    context: string | null;
    engagedTools: number;
    wroteNote: boolean;
    usedTags: boolean;
  } | null>(null);

  useEffect(() => {
    if (!message) return;
    saveSession({
      message,
      context,
      pauseInstanceId,
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
    });
  }, [
    message,
    context,
    pauseInstanceId,
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

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const [swipeDirection, setSwipeDirection] = useState<'forward' | 'back'>('forward');

  const goToStep = useCallback(
    (next: PauseStep) => {
      const currentIndex = STEPS.indexOf(step);
      const nextIndex = STEPS.indexOf(next);
      setSwipeDirection(nextIndex >= currentIndex ? 'forward' : 'back');
      hapticFeedback('light');
      setStep(next);
    },
    [step],
  );

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

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 50;
      const velocityThreshold = 300;
      if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
        goForward();
      } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
        goBack();
      }
    },
    [goForward, goBack],
  );

  const handleMoodSelect = useCallback(
    async (mood: MoodValue) => {
      hapticFeedback('light');
      setMoodDone(true);
      setSelectedMood(mood);
      if (pauseInstanceId) {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'initial_emotion_logged',
          payload: { mood },
        }).catch(() => {});
      }
    },
    [pauseInstanceId],
  );

  const handleMoodSkip = useCallback(() => {
    setMoodDone(true);
  }, []);

  const handleMoodReset = useCallback(() => {
    setMoodDone(false);
    setSelectedMood(null);
  }, []);

  const handleMoodAfterSelect = useCallback(
    async (mood: MoodValue) => {
      hapticFeedback('light');
      setMoodAfterDone(true);
      setSelectedMoodAfter(mood);
      if (pauseInstanceId) {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'shift_emotion_logged',
          payload: { mood },
        }).catch(() => {});
      }
    },
    [pauseInstanceId],
  );

  const handleMoodAfterSkip = useCallback(() => {
    setMoodAfterDone(true);
  }, []);

  const handleMoodAfterReset = useCallback(() => {
    setMoodAfterDone(false);
    setSelectedMoodAfter(null);
  }, []);

  const toggleFavorite = useCallback(async () => {
    if (!pauseInstanceId) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    hapticFeedback('light');
    await pauseLogStep({
      instanceId: pauseInstanceId,
      stepType: 'favorite_toggled',
      payload: { is_favorite: newVal },
    }).catch(() => setIsFavorite(!newVal));
    try {
      await supabase
        .from('library_items')
        .update({ is_favorite: newVal })
        .eq('pause_instance_id', pauseInstanceId)
        .eq('source_type', 'pause');
    } catch {
      /* non-fatal */
    }
    if (newVal && !subscribed) {
      toast(t('pause.favoriteProHint'), { duration: 4000 });
    }
  }, [pauseInstanceId, isFavorite, subscribed, t]);

  const handleClose = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const handleReturn = useCallback(() => {
    clearSession();
    navigate('/', { replace: true });
  }, [navigate]);

  const handleDecide = useCallback(
    async (d: string) => {
      hapticFeedback('medium');
      setDecision(d);
      dismissMessage();
      if (pauseInstanceId) {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'outcome_logged',
          payload: { outcome: d },
        }).catch(() => {});
        void refreshSubscription();
      }
      setPauseImpactData({
        mood: selectedMood,
        moodAfter: selectedMoodAfter,
        breathingCompleted,
        decision: d,
        context,
        engagedTools: 0,
        wroteNote: false,
        usedTags: false,
      });
      hapticFeedback('success');
      setPhase('done');
      clearSession();
    },
    [dismissMessage, pauseInstanceId, selectedMood, selectedMoodAfter, context, breathingCompleted, refreshSubscription],
  );

  const slideX = prefersReducedMotion ? 0 : 80;
  const stepTransition = {
    initial: { opacity: 0, x: swipeDirection === 'forward' ? slideX : -slideX },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: swipeDirection === 'forward' ? -slideX : slideX },
    transition: {
      duration: prefersReducedMotion ? 0.1 : 0.35,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
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
                    if (pauseInstanceId) {
                      void pauseLogStep({
                        instanceId: pauseInstanceId,
                        stepType: 'breath_completed',
                      });
                    }
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
