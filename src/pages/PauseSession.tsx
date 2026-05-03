import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { hapticFeedback } from '@/lib/haptics';
import { type MoodValue } from '@/components/MoodCheck';
import { type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';

import {
  type PauseStep,
  STEPS,
  pauseDeepMacroStepNumber,
  PAUSE_DEEP_DISPLAY_STEP_COUNT,
} from '@/components/pause/PauseProgress';
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
import { PauseBriefProgress } from '@/components/pause/PauseBriefProgress';
import { BRIEF_PAUSE_ORDER, computeBriefMacroProgressPosition } from '@/lib/brief-pause-order';
import { computeBriefPastStepClick } from '@/lib/brief-pause-past-step-click';
import { computePauseGoBackPlan } from '@/lib/pause-go-back-plan';
import { pauseStepSwipeDirection } from '@/lib/pause-step-swipe-direction';
import { computePauseHeaderBackIntent, isPauseSessionHeaderBackVisible } from '@/lib/pause-session-header-back';
import { PauseBriefFeel, type BriefFeelTile } from '@/components/pause/PauseBriefFeel';
import { PauseBriefIntegrate } from '@/components/pause/PauseBriefIntegrate';
import { PauseAboutPausesBody } from '@/components/pause/PauseAboutPausesBody';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { trackedAssetSymbol } from '@/lib/tracked-assets';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';
import {
  mapPersistedStep,
  initialRitualEntry,
  briefStepToPauseScienceStep,
} from '@/lib/pause-session-step-map';
import { computePauseStorageRitualSyncPatch } from '@/lib/pause-session-storage-ritual-sync';
import { buildPauseSessionPersistSnapshot } from '@/lib/pause-session-persist-snapshot';
import { parsePauseSessionLocationState } from '@/lib/router-location-state';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import {
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  saveSession,
  loadSession,
  clearSession,
} from '@/lib/pause-session-storage';
import { pauseLogStep } from '@/lib/pause-api';
import {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
} from '@/lib/pause-breath-second-label-variant';
import {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
} from '@/lib/pause-initial-emotion-log';
import { usePauseSessionStepTransition } from '@/hooks/use-pause-session-step-transition';
import { usePauseBreathSegmentRpcLoggers } from '@/hooks/use-pause-breath-segment-rpc-loggers';
import { usePauseFeelShiftLogDedupeRefs } from '@/hooks/use-pause-feel-shift-log-dedupe-refs';
import { buildShiftEmotionFrameHubLogBundle } from '@/lib/pause-shift-emotion-log';
import { buildPauseImpactDataOnComplete, type PauseImpactData } from '@/lib/pause-impact-data';
import { showPauseFavoriteProHintToast } from '@/lib/pause-favorite-toast';
import { buildOutcomeLoggedPayload } from '@/lib/pause-outcome-log-payload';
import { showPauseOutcomeNotCompletedToast, showPauseOutcomeSaveFailedToast } from '@/lib/pause-outcome-toast';
import { showPauseStepSyncFailedToast } from '@/lib/pause-step-sync-toast';
import type { PauseState } from '@/lib/pause-state';
import { getSessionQuote } from '@/lib/wisdom-quotes';
import { usePauseSessionShell } from '@/hooks/use-pause-session-shell';
import { usePauseSessionMountLog } from '@/hooks/use-pause-session-mount-log';

export default function PauseSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { value: step5BreathLabelRaw, ready: step5FlagReady } = useFeatureFlag('pause.step5_breath_label_shift', false);
  const breathSecondLabelVariant = resolvePauseBreathSecondLabelVariant({
    viteWantsShift: viteWantsPauseBreathSecondLabelShift(
      import.meta.env.VITE_PAUSE_STEP5_BREATH_LABEL_SHIFT as string | undefined,
    ),
    flagReady: step5FlagReady,
    posthogRaw: step5BreathLabelRaw,
  });
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

  const nav = parsePauseSessionLocationState(location.state);
  const {
    pauseInstanceId: navPauseInstanceId,
    reflectionMessage: navReflectionMessage,
    context: navContext,
    companions: navCompanions,
    companionPrefs: navCompanionPrefs,
    severity: navSeverity,
  } = nav;

  const { restored, hydration, fetchPauseInstanceId, fetchedInstance, fetchFailed, resolved } = usePauseSessionShell({
    locationKey: location.key,
    nav,
    holzen: {
      message: holzenMessage,
      context: holzenContext,
      lastPauseInstanceId: holzenLastPauseInstanceId,
      companions: holzenCompanions,
      companionPrefs: holzenCompanionPrefs,
      severity: holzenSeverity,
    },
  });

  usePauseSessionMountLog({
    pauseInstanceIdPrefix: (fetchPauseInstanceId ?? navPauseInstanceId)?.slice(0, 8) ?? null,
    hasNavMessage: navReflectionMessage.length > 0,
    restoredFromStorage: restored !== null,
    hydrationStatus: hydration.status,
  });

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
  const [pauseImpactData, setPauseImpactData] = useState<PauseImpactData | null>(null);

  const {
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
  } = usePauseBreathSegmentRpcLoggers({
    pauseInstanceId,
    initialSegment1Logged: restoredIdx > STEPS.indexOf('breathe'),
    initialSegment2Logged: restoredIdx > STEPS.indexOf('breath2'),
    t,
  });
  const { lastFeelLogKeyRef, lastShiftLogKeyRef } = usePauseFeelShiftLogDedupeRefs(pauseInstanceId);

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
    const patch = computePauseStorageRitualSyncPatch(pauseInstanceId, loadSession());
    if (!patch) return;
    setRitualEntry(patch.ritualEntry);
    if (patch.briefStep !== undefined) setBriefStep(patch.briefStep);
    setBriefIntegrateDone(patch.briefIntegrateDone);
    setSelectedBriefFace(patch.selectedBriefFace);
  }, [pauseInstanceId]);

  useEffect(() => {
    if (!message) return;
    saveSession(
      buildPauseSessionPersistSnapshot({
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
      }),
    );
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
      setSwipeDirection(pauseStepSwipeDirection(step, next));
      hapticFeedback('light');
      setStep(next);
    },
    [step],
  );

  const goBack = useCallback(() => {
    const plan = computePauseGoBackPlan(ritualEntry, briefStep, step);
    if (plan.kind === 'none') return;
    setSwipeDirection('back');
    hapticFeedback('light');
    if (plan.kind === 'brief') {
      if (plan.clearBriefIntegrateDone) setBriefIntegrateDone(false);
      setBriefStep(plan.prev);
    } else {
      setStep(plan.prev);
    }
  }, [step, ritualEntry, briefStep]);

  const breathingRef = useRef<PauseBreathingHandle>(null);
  const decidingRef = useRef(false);
  const [breathTimedActive, setBreathTimedActive] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [decideOnBackStep, setDecideOnBackStep] = useState<'choose' | 'breath2'>(() => {
    if (restored?.decideOnBackStep) return restored.decideOnBackStep;
    if (restored?.step === 'decide') return 'breath2';
    return 'choose';
  });

  useEffect(() => {
    if (ritualEntry === 'brief') {
      if (briefStep !== 'breath') setBreathTimedActive(false);
      return;
    }
    if (step !== 'breathe' && step !== 'breath2') setBreathTimedActive(false);
  }, [step, ritualEntry, briefStep]);

  const handlePauseHeaderBack = useCallback(() => {
    const intent = computePauseHeaderBackIntent({
      ritualEntry,
      briefStep,
      step,
      breathTimedActive,
      breathingFirstCompleted,
      breathingSecondCompleted,
    });
    switch (intent.kind) {
      case 'brief_breath_reset_intro':
        breathingRef.current?.resetToIntro();
        return;
      case 'brief_breath_reset_intro_clear_first':
        breathingRef.current?.resetToIntro();
        setBreathingFirstCompleted(false);
        return;
      case 'deep_breath_reset_intro':
        breathingRef.current?.resetToIntro();
        return;
      case 'deep_breathe_reset_intro_clear_first':
        breathingRef.current?.resetToIntro();
        setBreathingFirstCompleted(false);
        return;
      case 'deep_breath2_reset_intro_clear_second':
        breathingRef.current?.resetToIntro();
        setBreathingSecondCompleted(false);
        return;
      case 'go_back':
        goBack();
    }
  }, [
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
    goBack,
  ]);

  const showPauseHeaderBack = isPauseSessionHeaderBackVisible({
    phase,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
  });

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
    const ok = await logBreathSegment1Skipped();
    if (!ok) return;
    setBreathingFirstCompleted(true);
    goToStep('reflect');
  }, [logBreathSegment1Skipped, goToStep]);

  const handleSkipSecondBreath = useCallback(async () => {
    setBreathingSecondCompleted(false);
    setDecideOnBackStep('breath2');
    const ok = await logBreathSegment2Skipped();
    if (!ok) return;
    setBreathingSecondCompleted(true);
    goToStep('decide');
  }, [logBreathSegment2Skipped, goToStep]);

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
    const ok = await logBreathSegment1Skipped({ briefRitual: true });
    if (!ok) return;
    setBreathingFirstCompleted(true);
    setBriefStep('integrate');
  }, [logBreathSegment1Skipped]);

  const handleBriefIntegrateComplete = useCallback(() => {
    if (integrateAdvanceRef.current) return;
    integrateAdvanceRef.current = true;
    setBriefIntegrateDone(true);
    setBriefStep('decide');
  }, []);

  const handleFrameImDone = useCallback(async () => {
    const { payload: shiftFramePayload, logKey } = buildShiftEmotionFrameHubLogBundle();
    if (pauseInstanceId) {
      if (lastShiftLogKeyRef.current !== logKey) {
        try {
          await pauseLogStep({
            instanceId: pauseInstanceId,
            stepType: 'shift_emotion_logged',
            payload: shiftFramePayload,
          });
          lastShiftLogKeyRef.current = logKey;
        } catch {
          showPauseStepSyncFailedToast(t);
          return;
        }
      }
    } else {
      lastShiftLogKeyRef.current = logKey;
    }
    setFrameDone(true);
    setMoodAfterDone(true);
    goToStep('breath2');
  }, [pauseInstanceId, goToStep, t, lastShiftLogKeyRef]);

  const handleMoodSelect = useCallback(
    async (
      mood: MoodValue,
      intensity?: number,
      opts?: { briefRitual?: boolean; briefFace?: BriefFeelTile },
    ) => {
      hapticFeedback('light');
      const payload = buildInitialEmotionLoggedPayload(mood, intensity, opts);
      const logKey = initialEmotionLogDedupeKey(payload, opts?.briefFace);
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
          showPauseStepSyncFailedToast(t);
        }
      }
    },
    [pauseInstanceId, t, lastFeelLogKeyRef],
  );

  const handleMoodSkip = useCallback(async () => {
    setFeelIntensity(null);
    if (pauseInstanceId) {
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'initial_emotion_logged',
          payload: initialEmotionSkippedLoggedPayload(),
        });
        lastFeelLogKeyRef.current = initialEmotionSkippedLogDedupeKey();
      } catch {
        showPauseStepSyncFailedToast(t);
        return;
      }
    }
    setMoodDone(true);
  }, [pauseInstanceId, t, lastFeelLogKeyRef]);

  const handleMoodReset = useCallback(() => {
    lastFeelLogKeyRef.current = null;
    setMoodDone(false);
    setSelectedMood(null);
    setFeelIntensity(null);
    setSelectedBriefFace(null);
  }, [lastFeelLogKeyRef]);

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
      showPauseFavoriteProHintToast(t);
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
              payload: buildOutcomeLoggedPayload(d),
            });
          } catch {
            showPauseOutcomeSaveFailedToast(t);
            return;
          }
          if (outcomeState !== 'completed') {
            showPauseOutcomeNotCompletedToast(t);
            void refreshSubscription();
            return;
          }
          void refreshSubscription();
        }
        setDecision(d);
        await dismissMessage();
        const q = getSessionQuote();
        setPauseImpactData(
          buildPauseImpactDataOnComplete({
            decision: d,
            context,
            selectedMood,
            selectedMoodAfter,
            ritualEntry,
            breathingFirstCompleted,
            breathingSecondCompleted,
            feelIntensity,
            shiftIntensity,
            reinforcementQuote: `"${q.text}" — ${q.author}`,
          }),
        );
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

  const briefMacroLine = useMemo(() => {
    if (ritualEntry !== 'brief') return undefined;
    const { n, total } = computeBriefMacroProgressPosition(briefStep);
    return t('pause.brief.macroProgress', { n, total });
  }, [ritualEntry, briefStep, t]);

  const goToBriefPastStep = useCallback(
    (target: BriefPauseStep) => {
      const nav = computeBriefPastStepClick(target, briefStep);
      if (!nav) return;
      setSwipeDirection('back');
      hapticFeedback('light');
      setBriefStep(nav.target);
      if (nav.clearBriefIntegrateDone) setBriefIntegrateDone(false);
    },
    [briefStep],
  );

  const stepTransition = usePauseSessionStepTransition({
    swipeDirection,
    prefersReducedMotion,
  });

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
            macroStepIndex={ritualEntry === 'brief' ? undefined : pauseDeepMacroStepNumber(step)}
            macroStepTotal={ritualEntry === 'brief' ? undefined : PAUSE_DEEP_DISPLAY_STEP_COUNT}
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
