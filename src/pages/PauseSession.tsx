import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { PendingPauseOfferShell } from '@/components/pause/PendingPauseOfferShell';
import { PauseFeel } from '@/components/pause/PauseFeel';
import { PauseBreathing, type PauseBreathingHandle } from '@/components/pause/PauseBreathing';
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
import { canAdvanceFromPauseStep } from '@/lib/pause-session-navigation';
import type { PauseState } from '@/lib/pause-state';
import { getSessionQuote } from '@/lib/wisdom-quotes';

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
    resyncOpenPauseFromDb,
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
  const [feelIntensity, setFeelIntensity] = useState<number | null>(restored?.feelIntensity ?? null);
  const [shiftIntensity, setShiftIntensity] = useState<number | null>(restored?.shiftIntensity ?? null);
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
    feelIntensity?: number | null;
    shiftIntensity?: number | null;
    reinforcementQuote?: string | null;
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
      feelIntensity,
      shiftIntensity,
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
    feelIntensity,
    shiftIntensity,
    phase,
    decision,
    step,
    breathingCompleted,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    lastFeelLogKeyRef.current = null;
    lastShiftLogKeyRef.current = null;
  }, [pauseInstanceId]);

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

  const breathingRef = useRef<PauseBreathingHandle>(null);
  const decidingRef = useRef(false);
  const lastFeelLogKeyRef = useRef<string | null>(null);
  const lastShiftLogKeyRef = useRef<string | null>(null);
  const [breathTimedActive, setBreathTimedActive] = useState(false);

  useEffect(() => {
    if (step !== 'breathe') setBreathTimedActive(false);
  }, [step]);

  const handlePauseHeaderBack = useCallback(() => {
    if (step === 'breathe' && breathTimedActive) {
      breathingRef.current?.resetToIntro();
      return;
    }
    if (step === 'breathe' && breathingCompleted) {
      breathingRef.current?.resetToIntro();
      setBreathingCompleted(false);
      return;
    }
    goBack();
  }, [step, breathTimedActive, breathingCompleted, goBack]);

  const showPauseHeaderBack =
    phase === 'session' &&
    (STEPS.indexOf(step) > 0 || (step === 'breathe' && breathTimedActive) || (step === 'breathe' && breathingCompleted));

  const handleBreathContinueToFeel = useCallback(async () => {
    if (pauseInstanceId) {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'breath_completed',
      }).catch(() => {});
    }
    goToStep('feel');
  }, [pauseInstanceId, goToStep]);

  const handleSkipBreath = useCallback(async () => {
    setBreathingCompleted(false);
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'breath_completed',
          payload: { skipped: true },
        });
      } catch {
        toast.error(
          t('pause.stepSyncFailed', {
            defaultValue: 'Could not sync this step. Check your connection and try again.',
          }),
          { duration: 5000 },
        );
        return;
      }
    }
    goToStep('feel');
  }, [pauseInstanceId, goToStep, t]);

  const goForward = useCallback(() => {
    if (
      !canAdvanceFromPauseStep({
        step,
        breathingCompleted,
        moodDone,
        moodAfterDone,
      })
    ) {
      return;
    }
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      setSwipeDirection('forward');
      hapticFeedback('light');
      setStep(STEPS[currentIndex + 1]);
    }
  }, [step, breathingCompleted, moodDone, moodAfterDone]);

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
    async (mood: MoodValue, intensity?: number) => {
      hapticFeedback('light');
      const payload =
        typeof intensity === 'number' ? { mood, intensity } : { mood };
      const logKey = JSON.stringify(payload);
      if (pauseInstanceId && lastFeelLogKeyRef.current === logKey) {
        setMoodDone(true);
        setSelectedMood(mood);
        setFeelIntensity(typeof intensity === 'number' ? intensity : null);
        return;
      }
      setMoodDone(true);
      setSelectedMood(mood);
      setFeelIntensity(typeof intensity === 'number' ? intensity : null);
      if (pauseInstanceId) {
        try {
          await pauseLogStep({
            instanceId: pauseInstanceId,
            stepType: 'initial_emotion_logged',
            payload,
          });
          lastFeelLogKeyRef.current = logKey;
        } catch {
          lastFeelLogKeyRef.current = null;
          setMoodDone(false);
          setSelectedMood(null);
          setFeelIntensity(null);
          toast.error(
            t('pause.stepSyncFailed', {
              defaultValue: 'Could not sync this step. Check your connection and try again.',
            }),
            { duration: 5000 },
          );
        }
      }
    },
    [pauseInstanceId, t],
  );

  const handleMoodSkip = useCallback(async () => {
    setFeelIntensity(null);
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'initial_emotion_logged',
          payload: { skipped: true },
        });
        lastFeelLogKeyRef.current = JSON.stringify({ skipped: true });
      } catch {
        toast.error(
          t('pause.stepSyncFailed', {
            defaultValue: 'Could not sync this step. Check your connection and try again.',
          }),
          { duration: 5000 },
        );
        return;
      }
    }
    setMoodDone(true);
  }, [pauseInstanceId, t]);

  const handleMoodReset = useCallback(() => {
    lastFeelLogKeyRef.current = null;
    setMoodDone(false);
    setSelectedMood(null);
    setFeelIntensity(null);
  }, []);

  const handleMoodAfterSelect = useCallback(
    async (mood: MoodValue, intensity?: number) => {
      hapticFeedback('light');
      const payload =
        typeof intensity === 'number' ? { mood, shift_intensity: intensity } : { mood };
      const logKey = JSON.stringify(payload);
      if (pauseInstanceId && lastShiftLogKeyRef.current === logKey) {
        setMoodAfterDone(true);
        setSelectedMoodAfter(mood);
        setShiftIntensity(typeof intensity === 'number' ? intensity : null);
        return;
      }
      setMoodAfterDone(true);
      setSelectedMoodAfter(mood);
      setShiftIntensity(typeof intensity === 'number' ? intensity : null);
      if (pauseInstanceId) {
        try {
          await pauseLogStep({
            instanceId: pauseInstanceId,
            stepType: 'shift_emotion_logged',
            payload,
          });
          lastShiftLogKeyRef.current = logKey;
        } catch {
          lastShiftLogKeyRef.current = null;
          setMoodAfterDone(false);
          setSelectedMoodAfter(null);
          setShiftIntensity(null);
          toast.error(
            t('pause.stepSyncFailed', {
              defaultValue: 'Could not sync this step. Check your connection and try again.',
            }),
            { duration: 5000 },
          );
        }
      }
    },
    [pauseInstanceId, t],
  );

  const handleMoodAfterSkip = useCallback(async () => {
    setShiftIntensity(null);
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'shift_emotion_logged',
          payload: { skipped: true },
        });
        lastShiftLogKeyRef.current = JSON.stringify({ skipped: true });
      } catch {
        toast.error(
          t('pause.stepSyncFailed', {
            defaultValue: 'Could not sync this step. Check your connection and try again.',
          }),
          { duration: 5000 },
        );
        return;
      }
    }
    setMoodAfterDone(true);
  }, [pauseInstanceId, t]);

  const handleMoodAfterReset = useCallback(() => {
    lastShiftLogKeyRef.current = null;
    setMoodAfterDone(false);
    setSelectedMoodAfter(null);
    setShiftIntensity(null);
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
      if (decidingRef.current) return;
      decidingRef.current = true;
      try {
        hapticFeedback('medium');
        // Persist outcome before clearing Home/Library preview state. Calling
        // dismissMessage() first races pause_dismiss_current against
        // pause_log_step: if dismiss wins, the instance becomes terminal and
        // outcome_logged is ignored — the pause stays "wrong" in history and
        // surfaces can disagree until reload.
        let outcomeState: PauseState | null = null;
        if (pauseInstanceId) {
          try {
            outcomeState = await pauseLogStep({
              instanceId: pauseInstanceId,
              stepType: 'outcome_logged',
              payload: { outcome: d },
            });
          } catch {
            toast.error(
              t('pause.outcomeSaveFailed', {
                defaultValue: 'Could not save your choice. Try again.',
              }),
              { duration: 5000 },
            );
            return;
          }
          if (outcomeState !== 'completed') {
            toast.error(
              t('pause.outcomeNotCompleted', {
                defaultValue:
                  'Your choice was saved, but this pause is not complete yet — open Reflect and finish a companion card, then choose again.',
              }),
              { duration: 8000 },
            );
            void refreshSubscription();
            return;
          }
          void refreshSubscription();
        }
        setDecision(d);
        await dismissMessage();
        const q = getSessionQuote();
        setPauseImpactData({
          mood: selectedMood,
          moodAfter: selectedMoodAfter,
          breathingCompleted,
          decision: d,
          context,
          engagedTools: 0,
          wroteNote: false,
          usedTags: false,
          feelIntensity,
          shiftIntensity,
          reinforcementQuote: `"${q.text}" — ${q.author}`,
        });
        hapticFeedback('success');
        setPhase('done');
        clearSession();
      } finally {
        decidingRef.current = false;
      }
    },
    [
      dismissMessage,
      pauseInstanceId,
      selectedMood,
      selectedMoodAfter,
      context,
      breathingCompleted,
      feelIntensity,
      shiftIntensity,
      refreshSubscription,
      t,
    ],
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
      <>
        <PendingPauseOfferShell
          onAfterMutation={() => void resyncOpenPauseFromDb()}
          navigateAfterAdopt={(instanceId) => {
            clearSession();
            navigate('/pause', { state: { pauseInstanceId: instanceId }, replace: true });
          }}
        />
        <PauseSessionScaffold
        curtainLifted={curtainLifted}
        prefersReducedMotion={!!prefersReducedMotion}
        onClose={handleClose}
        phase={phase}
        step={step}
        goToStep={goToStep}
        onHeaderBack={handlePauseHeaderBack}
        showHeaderBack={showPauseHeaderBack}
      >
        {phase === 'session' && (
          <AnimatePresence mode="wait" initial={false}>
            {step === 'breathe' && (
              <motion.div key="breathe" {...stepTransition} {...dragProps}>
                <PauseBreathing
                  ref={breathingRef}
                  mantra={mantra}
                  severity={severity}
                  completed={breathingCompleted}
                  onTimedBreathingChange={setBreathTimedActive}
                  onPatternComplete={() => setBreathingCompleted(true)}
                  onContinueToFeel={() => void handleBreathContinueToFeel()}
                  onSkipBreath={handleSkipBreath}
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
                  feelIntensity={feelIntensity}
                  onContinue={() => goToStep('reflect')}
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
                  priorMood={selectedMood}
                  shiftIntensity={shiftIntensity}
                  onContinue={() => goToStep('decide')}
                  groundingActivities={groundingActivities}
                />
              </motion.div>
            )}

            {step === 'decide' && (
              <motion.div key="decide" {...stepTransition} {...dragProps}>
                <PauseDecide onDecide={handleDecide} onBack={() => goToStep('shift')} />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {phase === 'done' && (
          <PauseDone decision={decision} onReturn={handleReturn} pauseData={pauseImpactData} />
        )}
      </PauseSessionScaffold>
      </>
    </PauseSessionGate>
  );
}
