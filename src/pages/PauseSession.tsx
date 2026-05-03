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
import { PauseFrame } from '@/components/pause/PauseFrame';
import { PauseChooseBridge } from '@/components/pause/PauseChooseBridge';
import { PauseDecide } from '@/components/pause/PauseDecide';
import { PauseDone } from '@/components/pause/PauseDone';
import { PauseDepthPicker } from '@/components/pause/PauseDepthPicker';
import { PauseBriefProgress, BRIEF_PAUSE_ORDER } from '@/components/pause/PauseBriefProgress';
import { PauseBriefFeel, type BriefFeelTile } from '@/components/pause/PauseBriefFeel';
import { PauseBriefIntegrate } from '@/components/pause/PauseBriefIntegrate';
import { PauseAboutPausesBody } from '@/components/pause/PauseAboutPausesBody';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { trackedAssetSymbol } from '@/lib/tracked-assets';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';
import { holzenLog } from '@/lib/holzen-console';
import { parsePauseSessionLocationState } from '@/lib/router-location-state';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
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

function mapPersistedStep(s: string | undefined): PauseStep {
  if (!s || s === 'pause') return 'feel';
  if (s === 'ground') return 'reflect';
  if (s === 'shift') return 'frame';
  if (STEPS.includes(s as PauseStep)) return s as PauseStep;
  return 'feel';
}

function initialRitualEntry(
  restored: ReturnType<typeof loadSession>,
): RitualDepth | 'picker' {
  if (!restored?.message) return 'picker';
  if (restored.ritualDepth === 'brief' || restored.ritualDepth === 'deep') return restored.ritualDepth;
  if (restored.moodDone || restored.phase === 'done' || restored.step !== 'feel') return 'deep';
  return 'picker';
}

/** Brief “Integrate” has no dedicated citations row — highlight Reflect (regulation) sources. */
function briefStepToPauseScienceStep(brief: BriefPauseStep): PauseStep {
  switch (brief) {
    case 'feel':
      return 'feel';
    case 'breath':
      return 'breathe';
    case 'integrate':
      return 'reflect';
    case 'decide':
      return 'decide';
  }
}

export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const viteStep5Shift =
    import.meta.env.VITE_PAUSE_STEP5_BREATH_LABEL_SHIFT === '1' ||
    import.meta.env.VITE_PAUSE_STEP5_BREATH_LABEL_SHIFT === 'true' ||
    import.meta.env.VITE_PAUSE_STEP5_BREATH_LABEL_SHIFT === 'shift';
  const { value: step5BreathLabelRaw, ready: step5FlagReady } = useFeatureFlag('pause.step5_breath_label_shift', false);
  const breathSecondLabelVariant =
    viteStep5Shift ||
    (step5FlagReady && (step5BreathLabelRaw === true || step5BreathLabelRaw === 'shift'))
      ? 'shift'
      : 'breathe';
  const {
    mantra,
    dismissMessage,
    message: holzenMessage,
    context: holzenContext,
    companions: holzenCompanions,
    lastPauseInstanceId: holzenLastPauseInstanceId,
    companionPrefs: holzenCompanionPrefs,
    severity: holzenSeverity,
    profileLoaded,
    resyncOpenPauseFromDb,
    btcData,
    trackedAssetId,
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
        const artifactRows = (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>;
        const companionData = companionDataFromArtifacts(artifactRows);
        const reflectionArt = artifactRows.find((a) => a.kind === 'reflection_text');
        const msg =
          typeof reflectionArt?.content?.message === 'string' ? (reflectionArt.content.message as string) : '';
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

  const restoredStep = mapPersistedStep(restored?.step);
  const restoredIdx = restored ? STEPS.indexOf(restoredStep) : -1;

  const [step, setStep] = useState<PauseStep>(restoredStep);
  const [phase, setPhase] = useState<'session' | 'done'>(restored?.phase ?? 'session');
  const [decision, setDecision] = useState<string | null>(restored?.decision ?? null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [moodDone, setMoodDone] = useState(restored?.moodDone ?? false);
  const [moodAfterDone, setMoodAfterDone] = useState(restored?.moodAfterDone ?? false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(restored?.selectedMood ?? null);
  const [selectedMoodAfter, setSelectedMoodAfter] = useState<MoodValue | null>(restored?.selectedMoodAfter ?? null);
  const [feelIntensity, setFeelIntensity] = useState<number | null>(restored?.feelIntensity ?? null);
  const [shiftIntensity, setShiftIntensity] = useState<number | null>(restored?.shiftIntensity ?? null);
  const [breathingFirstCompleted, setBreathingFirstCompleted] = useState(
    restored?.breathingFirstCompleted ?? restored?.breathingCompleted ?? false,
  );
  const [breathingSecondCompleted, setBreathingSecondCompleted] = useState(restored?.breathingSecondCompleted ?? false);
  const [frameDone, setFrameDone] = useState(restored?.frameDone ?? false);
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

  const breath1RpcDoneRef = useRef(restoredIdx > STEPS.indexOf('breathe'));
  const breath2RpcDoneRef = useRef(restoredIdx > STEPS.indexOf('breath2'));
  const lastShiftLogKeyRef = useRef<string | null>(null);

  const [ritualEntry, setRitualEntry] = useState<RitualDepth | 'picker'>(() => initialRitualEntry(restored));
  const [briefStep, setBriefStep] = useState<BriefPauseStep>(() => {
    if (restored?.ritualDepth === 'brief' && restored.briefStep) return restored.briefStep;
    return 'feel';
  });
  const [briefIntegrateDone, setBriefIntegrateDone] = useState(restored?.briefIntegrateDone ?? false);
  const [selectedBriefFace, setSelectedBriefFace] = useState<BriefFeelTile | null>(
    (restored?.briefFace as BriefFeelTile | null) ?? null,
  );
  const [pickerAboutOpen, setPickerAboutOpen] = useState(false);

  useEffect(() => {
    if (!pauseInstanceId) return;
    const saved = loadSession();
    if (saved?.pauseInstanceId && saved.pauseInstanceId !== pauseInstanceId) return;
    setRitualEntry(initialRitualEntry(saved));
    if (saved?.ritualDepth === 'brief' && saved.briefStep) setBriefStep(saved.briefStep);
    else if (saved?.ritualDepth !== 'brief') setBriefStep('feel');
    setBriefIntegrateDone(saved?.briefIntegrateDone ?? false);
    setSelectedBriefFace((saved?.briefFace as BriefFeelTile | null) ?? null);
  }, [pauseInstanceId]);

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
      breathingFirstCompleted,
      breathingSecondCompleted,
      frameDone,
      decideOnBackStep,
      ritualDepth: ritualEntry === 'picker' ? undefined : ritualEntry,
      briefStep: ritualEntry === 'brief' ? briefStep : undefined,
      briefIntegrateDone: ritualEntry === 'brief' ? briefIntegrateDone : undefined,
      briefFace: ritualEntry === 'brief' ? selectedBriefFace ?? undefined : undefined,
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
    breathingFirstCompleted,
    breathingSecondCompleted,
    frameDone,
    decideOnBackStep,
    ritualEntry,
    briefStep,
    briefIntegrateDone,
    selectedBriefFace,
  ]);

  useEffect(() => {
    if (step === 'breath2') setDecideOnBackStep('choose');
  }, [step]);

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
    if (ritualEntry === 'brief') {
      const i = BRIEF_PAUSE_ORDER.indexOf(briefStep);
      if (i > 0) {
        setSwipeDirection('back');
        hapticFeedback('light');
        const prev = BRIEF_PAUSE_ORDER[i - 1]!;
        if (briefStep === 'decide' && prev === 'integrate') setBriefIntegrateDone(false);
        if (briefStep === 'integrate') setBriefIntegrateDone(false);
        setBriefStep(prev);
      }
      return;
    }
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setSwipeDirection('back');
      hapticFeedback('light');
      setStep(STEPS[currentIndex - 1]);
    }
  }, [step, ritualEntry, briefStep]);

  const breathingRef = useRef<PauseBreathingHandle>(null);
  const decidingRef = useRef(false);
  const lastFeelLogKeyRef = useRef<string | null>(null);
  const prevPauseInstanceIdRef = useRef<string | null>(null);
  const [breathTimedActive, setBreathTimedActive] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [decideOnBackStep, setDecideOnBackStep] = useState<'choose' | 'breath2'>(() => {
    if (restored?.decideOnBackStep) return restored.decideOnBackStep;
    if (restored?.step === 'decide') return 'breath2';
    return 'choose';
  });

  useEffect(() => {
    lastFeelLogKeyRef.current = null;
    lastShiftLogKeyRef.current = null;
    const prev = prevPauseInstanceIdRef.current;
    if (prev !== null && prev !== pauseInstanceId) {
      breath1RpcDoneRef.current = false;
      breath2RpcDoneRef.current = false;
    }
    prevPauseInstanceIdRef.current = pauseInstanceId;
  }, [pauseInstanceId]);

  useEffect(() => {
    if (ritualEntry === 'brief') {
      if (briefStep !== 'breath') setBreathTimedActive(false);
      return;
    }
    if (step !== 'breathe' && step !== 'breath2') setBreathTimedActive(false);
  }, [step, ritualEntry, briefStep]);

  const ensureBreathSegment1Logged = useCallback(async (briefRitual?: boolean): Promise<boolean> => {
    if (!pauseInstanceId) return true;
    if (breath1RpcDoneRef.current) return true;
    try {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'breath_completed',
        payload: briefRitual ? { breath_segment: 1, brief_ritual: true } : { breath_segment: 1 },
      });
      breath1RpcDoneRef.current = true;
      return true;
    } catch {
      toast.error(
        t('pause.stepSyncFailed', {
          defaultValue: 'Could not sync this step. Check your connection and try again.',
        }),
        { duration: 5000 },
      );
      return false;
    }
  }, [pauseInstanceId, t]);

  const ensureBreathSegment2Logged = useCallback(async (): Promise<boolean> => {
    if (!pauseInstanceId) return true;
    if (breath2RpcDoneRef.current) return true;
    try {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'breath_completed',
        payload: { breath_segment: 2 },
      });
      breath2RpcDoneRef.current = true;
      return true;
    } catch {
      toast.error(
        t('pause.stepSyncFailed', {
          defaultValue: 'Could not sync this step. Check your connection and try again.',
        }),
        { duration: 5000 },
      );
      return false;
    }
  }, [pauseInstanceId, t]);

  const handlePauseHeaderBack = useCallback(() => {
    if (ritualEntry === 'brief') {
      if (briefStep === 'breath' && breathTimedActive) {
        breathingRef.current?.resetToIntro();
        return;
      }
      if (briefStep === 'breath' && breathingFirstCompleted) {
        breathingRef.current?.resetToIntro();
        setBreathingFirstCompleted(false);
        return;
      }
      goBack();
      return;
    }
    if ((step === 'breathe' || step === 'breath2') && breathTimedActive) {
      breathingRef.current?.resetToIntro();
      return;
    }
    if (step === 'breathe' && breathingFirstCompleted) {
      breathingRef.current?.resetToIntro();
      setBreathingFirstCompleted(false);
      return;
    }
    if (step === 'breath2' && breathingSecondCompleted) {
      breathingRef.current?.resetToIntro();
      setBreathingSecondCompleted(false);
      return;
    }
    goBack();
  }, [
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
    goBack,
  ]);

  const showPauseHeaderBack =
    phase === 'session' &&
    (ritualEntry === 'brief'
      ? BRIEF_PAUSE_ORDER.indexOf(briefStep) > 0 ||
        (briefStep === 'breath' && breathTimedActive) ||
        (briefStep === 'breath' && breathingFirstCompleted)
      : STEPS.indexOf(step) > 0 ||
        ((step === 'breathe' || step === 'breath2') && breathTimedActive) ||
        ((step === 'breathe' || step === 'breath2') &&
          (step === 'breathe' ? breathingFirstCompleted : breathingSecondCompleted)));

  const handleContinueAfterFirstBreath = useCallback(async () => {
    const ok = await ensureBreathSegment1Logged();
    if (!ok) return;
    goToStep('reflect');
  }, [ensureBreathSegment1Logged, goToStep]);

  const handleContinueAfterSecondBreath = useCallback(async () => {
    const ok = await ensureBreathSegment2Logged();
    if (!ok) return;
    goToStep('choose');
  }, [ensureBreathSegment2Logged, goToStep]);

  const handleSkipFirstBreath = useCallback(async () => {
    setBreathingFirstCompleted(false);
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'breath_completed',
          payload: { skipped: true, breath_segment: 1 },
        });
        breath1RpcDoneRef.current = true;
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
    setBreathingFirstCompleted(true);
    goToStep('reflect');
  }, [pauseInstanceId, goToStep, t]);

  const handleSkipSecondBreath = useCallback(async () => {
    setBreathingSecondCompleted(false);
    setDecideOnBackStep('breath2');
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'breath_completed',
          payload: { skipped: true, breath_segment: 2 },
        });
        breath2RpcDoneRef.current = true;
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
    setBreathingSecondCompleted(true);
    goToStep('decide');
  }, [pauseInstanceId, goToStep, t]);

  const handleBriefBreathContinue = useCallback(async () => {
    const ok = await ensureBreathSegment1Logged(true);
    if (!ok) return;
    setBriefStep('integrate');
  }, [ensureBreathSegment1Logged]);

  const integrateAdvanceRef = useRef(false);
  useEffect(() => {
    if (ritualEntry === 'brief' && briefStep === 'integrate') integrateAdvanceRef.current = false;
  }, [ritualEntry, briefStep]);

  const handleBriefSkipBreath = useCallback(async () => {
    setBreathingFirstCompleted(false);
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'breath_completed',
          payload: { skipped: true, breath_segment: 1, brief_ritual: true },
        });
        breath1RpcDoneRef.current = true;
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
    setBreathingFirstCompleted(true);
    setBriefStep('integrate');
  }, [pauseInstanceId, t]);

  const handleBriefIntegrateComplete = useCallback(() => {
    if (integrateAdvanceRef.current) return;
    integrateAdvanceRef.current = true;
    setBriefIntegrateDone(true);
    setBriefStep('decide');
  }, []);

  const handleFrameImDone = useCallback(async () => {
    const logKey = JSON.stringify({ from_frame_hub: true });
    if (pauseInstanceId) {
      if (lastShiftLogKeyRef.current !== logKey) {
        try {
          await pauseLogStep({
            instanceId: pauseInstanceId,
            stepType: 'shift_emotion_logged',
            payload: { from_frame_hub: true },
          });
          lastShiftLogKeyRef.current = logKey;
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
    } else {
      lastShiftLogKeyRef.current = logKey;
    }
    setFrameDone(true);
    setMoodAfterDone(true);
    goToStep('breath2');
  }, [pauseInstanceId, goToStep, t]);

  const handleMoodSelect = useCallback(
    async (
      mood: MoodValue,
      intensity?: number,
      opts?: { briefRitual?: boolean; briefFace?: BriefFeelTile },
    ) => {
      hapticFeedback('light');
      const payload: Record<string, unknown> =
        typeof intensity === 'number' ? { mood, intensity } : { mood };
      if (opts?.briefRitual) payload.brief_ritual = true;
      if (opts?.briefFace) payload.brief_face = opts.briefFace;
      const logKey = JSON.stringify({ ...payload, _bf: opts?.briefFace });
      if (pauseInstanceId && lastFeelLogKeyRef.current === logKey) {
        setMoodDone(true);
        setSelectedMood(mood);
        setFeelIntensity(typeof intensity === 'number' ? intensity : null);
        if (opts?.briefFace) setSelectedBriefFace(opts.briefFace);
        return;
      }
      setMoodDone(true);
      setSelectedMood(mood);
      setFeelIntensity(typeof intensity === 'number' ? intensity : null);
      if (opts?.briefFace) setSelectedBriefFace(opts.briefFace);
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
    setSelectedBriefFace(null);
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
          breathingCompleted:
            ritualEntry === 'brief'
              ? breathingFirstCompleted
              : breathingFirstCompleted && breathingSecondCompleted,
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
      ritualEntry,
      breathingFirstCompleted,
      breathingSecondCompleted,
      feelIntensity,
      shiftIntensity,
      refreshSubscription,
      t,
    ],
  );

  const depthContextLine = useMemo(() => {
    if (!btcData) return null;
    const sym = trackedAssetSymbol(trackedAssetId);
    return t('pause.depthPicker.contextMoved', {
      defaultValue: '{{sym}} moved {{pct}}% in the last 24 hours.',
      sym,
      pct: Math.abs(btcData.changePercent).toFixed(1),
    });
  }, [btcData, trackedAssetId, t]);

  const briefMacroLine =
    ritualEntry === 'brief'
      ? t('pause.brief.macroProgress', {
          n: BRIEF_PAUSE_ORDER.indexOf(briefStep) + 1,
          total: BRIEF_PAUSE_ORDER.length,
        })
      : undefined;

  const goToBriefPastStep = useCallback(
    (target: BriefPauseStep) => {
      const ti = BRIEF_PAUSE_ORDER.indexOf(target);
      const ci = BRIEF_PAUSE_ORDER.indexOf(briefStep);
      if (ti >= ci) return;
      setSwipeDirection('back');
      hapticFeedback('light');
      setBriefStep(target);
      if (target === 'breath' || target === 'feel') setBriefIntegrateDone(false);
    },
    [briefStep],
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

  const sessionOnPicker = phase === 'session' && ritualEntry === 'picker' && !!message;

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
        {sessionOnPicker ? (
          <>
            <PauseDepthPicker
              contextLine={depthContextLine}
              onBrief={() => {
                setRitualEntry('brief');
                setBriefStep('feel');
              }}
              onDeep={() => setRitualEntry('deep')}
              onAboutPauses={() => setPickerAboutOpen(true)}
              onClose={handleClose}
            />
            <Sheet open={pickerAboutOpen} onOpenChange={setPickerAboutOpen}>
              <SheetContent
                side="bottom"
                className="z-[120] max-h-[88vh] overflow-y-auto rounded-t-2xl border-t p-6 sm:p-8"
              >
                <SheetTitle className="sr-only">{t('pause.aboutPauses.sheetTitle')}</SheetTitle>
                <PauseAboutPausesBody />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <PauseSessionScaffold
            curtainLifted={curtainLifted}
            prefersReducedMotion={!!prefersReducedMotion}
            onClose={handleClose}
            phase={phase}
            step={step}
            goToStep={goToStep}
            onHeaderBack={handlePauseHeaderBack}
            showHeaderBack={showPauseHeaderBack}
            macroStepIndex={ritualEntry === 'brief' ? undefined : STEPS.indexOf(step) + 1}
            macroStepTotal={ritualEntry === 'brief' ? undefined : STEPS.length}
            macroProgressLine={briefMacroLine}
            sessionTitle={ritualEntry === 'brief' ? t('pause.brief.sessionTitle') : undefined}
            stepperSlot={
              ritualEntry === 'brief' ? (
                <PauseBriefProgress currentStep={briefStep} onStepClick={goToBriefPastStep} />
              ) : undefined
            }
            scienceCurrentStep={ritualEntry === 'brief' ? briefStepToPauseScienceStep(briefStep) : undefined}
            breathSecondLabelVariant={breathSecondLabelVariant}
            hideScienceButton={
              ritualEntry === 'brief'
                ? briefStep === 'breath'
                : step === 'breathe' || step === 'breath2'
            }
            soundMuted={soundMuted}
            onSoundMutedChange={setSoundMuted}
          >
            {phase === 'session' && ritualEntry === 'brief' && (
              <AnimatePresence mode="wait" initial={false}>
                {briefStep === 'feel' && (
                  <motion.div key="b-feel" {...stepTransition}>
                    <PauseBriefFeel
                      moodDone={moodDone}
                      selectedMood={selectedMood}
                      selectedTile={selectedBriefFace}
                      feelIntensity={feelIntensity}
                      onSelect={(mood, intensity, tile) =>
                        void handleMoodSelect(mood, intensity, { briefRitual: true, briefFace: tile })
                      }
                      onContinue={() => setBriefStep('breath')}
                    />
                  </motion.div>
                )}

                {briefStep === 'breath' && (
                  <motion.div key="b-breath" {...stepTransition}>
                    <PauseBreathing
                      ref={breathingRef}
                      key="breath-brief"
                      breathSegment="first"
                      ritualVariant="brief"
                      mantra={mantra}
                      severity={severity}
                      completed={breathingFirstCompleted}
                      onTimedBreathingChange={setBreathTimedActive}
                      onPatternComplete={() => setBreathingFirstCompleted(true)}
                      onContinueAfterBreath={() => void handleBriefBreathContinue()}
                      onSkipBreath={handleBriefSkipBreath}
                      ritualSoundMuted={soundMuted}
                    />
                  </motion.div>
                )}

                {briefStep === 'integrate' && (
                  <motion.div key="b-integrate" {...stepTransition}>
                    <PauseBriefIntegrate done={briefIntegrateDone} onComplete={handleBriefIntegrateComplete} />
                  </motion.div>
                )}

                {briefStep === 'decide' && (
                  <motion.div key="b-decide" {...stepTransition}>
                    <PauseDecide
                      onDecide={handleDecide}
                      onBack={() => setBriefStep('integrate')}
                      introKicker={t('pause.brief.decideKicker', { defaultValue: 'Step 4 · Decide' })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {phase === 'session' && ritualEntry === 'deep' && (
              <AnimatePresence mode="wait" initial={false}>
                {step === 'feel' && (
                  <motion.div key="feel" {...stepTransition}>
                    <PauseFeel
                      onMoodSelect={handleMoodSelect}
                      onMoodSkip={handleMoodSkip}
                      onMoodReset={handleMoodReset}
                      moodDone={moodDone}
                      selectedMood={selectedMood}
                      feelIntensity={feelIntensity}
                      onContinue={() => goToStep('breathe')}
                    />
                  </motion.div>
                )}

                {step === 'breathe' && (
                  <motion.div key="breathe" {...stepTransition}>
                    <PauseBreathing
                      ref={breathingRef}
                      key="breath-segment-first"
                      breathSegment="first"
                      ritualVariant="deep"
                      mantra={mantra}
                      severity={severity}
                      completed={breathingFirstCompleted}
                      onTimedBreathingChange={setBreathTimedActive}
                      onPatternComplete={() => setBreathingFirstCompleted(true)}
                      onContinueAfterBreath={() => void handleContinueAfterFirstBreath()}
                      onSkipBreath={handleSkipFirstBreath}
                      ritualSoundMuted={soundMuted}
                    />
                  </motion.div>
                )}

                {step === 'reflect' && (
                  <motion.div key="reflect" {...stepTransition}>
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
                      onContinue={() => goToStep('frame')}
                      mood={selectedMood}
                    />
                  </motion.div>
                )}

                {step === 'frame' && (
                  <motion.div key="frame" {...stepTransition}>
                    <PauseFrame
                      companions={companions}
                      pauseInstanceId={pauseInstanceId}
                      reflectionMessage={message}
                      onImDone={() => void handleFrameImDone()}
                    />
                  </motion.div>
                )}

                {step === 'breath2' && (
                  <motion.div key="breath2" {...stepTransition}>
                    <PauseBreathing
                      ref={breathingRef}
                      key="breath-segment-second"
                      breathSegment="second"
                      ritualVariant="deep"
                      mantra={mantra}
                      severity={severity}
                      completed={breathingSecondCompleted}
                      onTimedBreathingChange={setBreathTimedActive}
                      onPatternComplete={() => setBreathingSecondCompleted(true)}
                      onContinueAfterBreath={() => void handleContinueAfterSecondBreath()}
                      onSkipBreath={handleSkipSecondBreath}
                      ritualSoundMuted={soundMuted}
                    />
                  </motion.div>
                )}

                {step === 'choose' && (
                  <motion.div key="choose" {...stepTransition}>
                    <PauseChooseBridge
                      onChoose={() => {
                        setDecideOnBackStep('choose');
                        goToStep('decide');
                      }}
                    />
                  </motion.div>
                )}

                {step === 'decide' && (
                  <motion.div key="decide" {...stepTransition}>
                    <PauseDecide onDecide={handleDecide} onBack={() => goToStep(decideOnBackStep)} />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {phase === 'done' && (
              <PauseDone decision={decision} onReturn={handleReturn} pauseData={pauseImpactData} />
            )}
          </PauseSessionScaffold>
        )}
      </>
    </PauseSessionGate>
  );
}
