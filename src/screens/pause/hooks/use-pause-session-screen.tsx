/**
 * `/pause` route orchestration — wires shell, ritual state, step handlers, and scaffold props.
 * Screen map: docs/screens/pause.md · Product model: docs/systems/pause-system.md
 */
import { useState, useRef, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import { type MoodValue } from '@/screens/pause/components/MoodCheck';
import { type PauseStep } from '@/screens/pause/components/PauseProgress';
import { isPauseSessionHeaderBackVisible } from '@/features/pause/public';
import {
  mapPersistedStep,
  initialRitualEntry,
  initialBriefPauseStepFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialSelectedBriefFaceFromRestored,
  initialPhaseFromRestored,
  initialDecisionFromRestored,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialFrameDoneFromRestored,
} from '@/features/pause/public';
import { parsePauseSessionLocationState } from '@/features/pause/public';
import { coalescePauseSessionShellViewModel } from '@/features/pause/public';
import {
  isPauseSessionDepthPickerActive,
  isPauseSessionWaitingForInstanceFetch,
} from '@/features/pause/public';
import { usePauseSessionStepTransition } from '@/screens/pause/hooks/use-pause-session-step-transition';
import { usePauseBreathSegmentRpcLoggers } from '@/screens/pause/hooks/use-pause-breath-segment-rpc-loggers';
import { usePauseFeelShiftLogDedupeRefs } from '@/screens/pause/hooks/use-pause-feel-shift-log-dedupe-refs';
import { usePauseFavoriteToggle } from '@/screens/pause/hooks/use-pause-favorite-toggle';
import { usePauseSessionInitialMoodHandlers } from '@/screens/pause/hooks/use-pause-session-initial-mood-handlers';
import { usePauseShiftFrameDoneHandler } from '@/screens/pause/hooks/use-pause-shift-frame-done-handler';
import { usePauseSessionDecideHandler } from '@/screens/pause/hooks/use-pause-session-decide-handler';
import { usePauseSessionExitNavigation } from '@/screens/pause/hooks/use-pause-session-exit-navigation';
import { isPauseReflectGenerationEnabled } from '@/features/pause/public';
import { usePauseSessionBreathStepHandlers } from '@/screens/pause/hooks/use-pause-session-breath-step-handlers';
import { usePauseSessionHeaderBackHandler } from '@/screens/pause/hooks/use-pause-session-header-back-handler';
import { usePauseSessionPersistToStorage } from '@/screens/pause/hooks/use-pause-session-persist-to-storage';
import { usePauseSessionRitualStorageSync } from '@/screens/pause/hooks/use-pause-session-ritual-storage-sync';
import { usePauseSessionEntryPresentationEffects } from '@/screens/pause/hooks/use-pause-session-entry-presentation-effects';
import { usePauseSessionBreathUi } from '@/screens/pause/hooks/use-pause-session-breath-ui';
import { usePauseSessionBriefToDeep } from '@/screens/pause/hooks/use-pause-session-brief-to-deep';
import { usePauseSessionDepthAndBriefCopy } from '@/screens/pause/hooks/use-pause-session-depth-and-brief-copy';
import { usePauseSessionBreathSecondLabelVariant } from '@/screens/pause/hooks/use-pause-session-breath-second-label-variant';
import type { PauseImpactData } from '@/features/pause/public';
import { usePauseSessionShell } from '@/screens/pause/hooks/use-pause-session-shell';
import { usePauseSessionTerminalEntryRedirect } from '@/screens/pause/hooks/use-pause-session-terminal-entry-redirect';
import { usePauseSessionMountLog } from '@/screens/pause/hooks/use-pause-session-mount-log';
import { usePauseSessionGoBack } from '@/screens/pause/hooks/use-pause-session-go-back';
import { usePauseSessionGoToStep } from '@/screens/pause/hooks/use-pause-session-go-to-step';
import { buildPauseSessionScaffoldRitualDerived } from '@/features/pause/public';
import { buildPauseSessionScaffoldRitualPayloads } from '@/features/pause/public';
import { JOURNEY_PREFIX } from '@/lib/app-routes';
import { buildPauseSessionMountLogParams } from '@/features/pause/public';
import { usePauseSessionPendingPauseOfferNavigation } from '@/screens/pause/hooks/use-pause-session-pending-pause-offer-navigation';
import { usePauseSessionPendingLeaveSheet } from '@/screens/pause/hooks/use-pause-session-pending-leave-sheet';
import { usePendingPauseOffer } from '@/screens/pause/hooks/use-pending-pause-offer';
import { usePauseSessionDepthPickerHandlers } from '@/screens/pause/hooks/use-pause-session-depth-picker-handlers';
import { usePauseSessionFeelTilesSelect } from '@/screens/pause/hooks/use-pause-session-feel-tiles-select';
import { usePauseReflectGeneration } from '@/screens/pause/hooks/use-pause-reflect-generation';
import { type BriefPauseStep, type RitualDepth } from '@/features/pause/public';
import { clearSession } from '@/features/pause/public';
import { usePauseSessionScaffoldChromeSlots } from '@/screens/pause/hooks/use-pause-session-scaffold-chrome-slots';

export function usePauseSessionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleReturn, handleClose } = usePauseSessionExitNavigation(navigate);
  const handleBriefSaveToJourney = useCallback(() => {
    clearSession();
    navigate(JOURNEY_PREFIX, { replace: true });
  }, [navigate]);
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const breathSecondLabelVariant = usePauseSessionBreathSecondLabelVariant();
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
  const {
    subscribed,
    loading: subLoading,
    entitlement,
    canEngagePause,
    checkoutLoading,
    trialLoading,
    ensureTrial,
    startReactivationCheckout,
    refresh: refreshSubscription,
  } = useSubscription();
  const { requirePro } = useProGate();

  const { onAfterMutation: pendingOfferAfterMutation, navigateAfterAdopt: pendingOfferNavigateAfterAdopt } =
    usePauseSessionPendingPauseOfferNavigation({
      navigate,
      resyncOpenPauseFromDb,
    });
  const { pending, refresh: refreshPendingOffer } = usePendingPauseOffer();

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

  usePauseSessionMountLog(
    buildPauseSessionMountLogParams({
      restored,
      fetchPauseInstanceId,
      navPauseInstanceId,
      navReflectionMessage,
      hydrationStatus: hydration.status,
    }),
  );

  const { message, context, pauseInstanceId, companions, companionPrefs, severity } =
    coalescePauseSessionShellViewModel(resolved, holzenSeverity);

  const pauseInstanceIdForTerminal =
    pauseInstanceId ?? navPauseInstanceId ?? fetchPauseInstanceId;

  const {
    leaveWithPendingOpen,
    setLeaveWithPendingOpen,
    leaveSheetBusy,
    confirmLeavePauseSession,
    requestExitPauseBeforeDone,
    handleDeclinePendingFromLeaveSheet,
    handlePendingAdoptFromLeaveSheet,
  } = usePauseSessionPendingLeaveSheet({
    pending,
    pauseInstanceIdForTerminal,
    handleClose,
    pendingOfferAfterMutation,
    pendingOfferNavigateAfterAdopt,
    refreshPendingOffer,
    t,
  });

  const hasCoalescedShellSession =
    Boolean(pauseInstanceIdForTerminal) || message.length > 0;

  const waitingForFetch = isPauseSessionWaitingForInstanceFetch({
    hydrationStatus: hydration.status,
    fetchFailed,
    fetchedInstance,
  });

  const restoredStep = mapPersistedStep(restored?.step);

  const [step, setStep] = useState<PauseStep>(restoredStep);
  const [phase, setPhase] = useState<'session' | 'done'>(() => initialPhaseFromRestored(restored));
  const [decision, setDecision] = useState<string | null>(() => initialDecisionFromRestored(restored));

  usePauseSessionTerminalEntryRedirect({
    pauseInstanceId: pauseInstanceIdForTerminal,
    shellReady:
      resolved != null ||
      (hydration.status === 'fetch' &&
        !waitingForFetch &&
        fetchedInstance != null &&
        pauseInstanceIdForTerminal != null),
    waitingForFetch,
    fetchFailed,
    fetchPauseInstanceId,
    fetchedInstance,
    restored,
    pauseSessionPhase: phase,
  });

  const [isFavorite, setIsFavorite] = useState(false);
  const { toggleFavorite } = usePauseFavoriteToggle({
    pauseInstanceId,
    isFavorite,
    setIsFavorite,
    subscribed,
    t,
  });
  const [moodDone, setMoodDone] = useState(restored?.moodDone ?? false);
  const [moodAfterDone, setMoodAfterDone] = useState(restored?.moodAfterDone ?? false);
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(restored?.selectedMood ?? null);
  const [selectedMoodAfter, setSelectedMoodAfter] = useState<MoodValue | null>(restored?.selectedMoodAfter ?? null);
  const [feelIntensity, setFeelIntensity] = useState<number | null>(restored?.feelIntensity ?? null);
  const [shiftIntensity, setShiftIntensity] = useState<number | null>(restored?.shiftIntensity ?? null);
  const [breathingFirstCompleted, setBreathingFirstCompleted] = useState(() =>
    initialBreathingFirstCompletedFromRestored(restored),
  );
  const [breathingSecondCompleted, setBreathingSecondCompleted] = useState(() =>
    initialBreathingSecondCompletedFromRestored(restored),
  );
  const [frameDone, setFrameDone] = useState(() => initialFrameDoneFromRestored(restored));
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [pauseImpactData, setPauseImpactData] = useState<PauseImpactData | null>(null);

  const handlePauseSessionChromeClose = useCallback(() => {
    if (phase === 'done') {
      handleReturn();
    } else {
      requestExitPauseBeforeDone();
    }
  }, [phase, handleReturn, requestExitPauseBeforeDone]);

  usePauseSessionEntryPresentationEffects({ setCurtainLifted });

  const {
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
  } = usePauseBreathSegmentRpcLoggers({
    pauseInstanceId,
    restored,
    t,
  });
  const { lastFeelLogKeyRef, lastShiftLogKeyRef } = usePauseFeelShiftLogDedupeRefs(pauseInstanceId);

  const [ritualEntry, setRitualEntry] = useState<RitualDepth | 'picker'>(() => initialRitualEntry(restored));
  const [briefStep, setBriefStep] = useState<BriefPauseStep>(() => initialBriefPauseStepFromRestored(restored));
  const [briefIntegrateDone, setBriefIntegrateDone] = useState(() =>
    initialBriefIntegrateDoneFromRestored(restored),
  );
  const [selectedBriefFace, setSelectedBriefFace] = useState(() => initialSelectedBriefFaceFromRestored(restored));
  const { onBrief: depthPickerOnBrief, onDeep: depthPickerOnDeep } = usePauseSessionDepthPickerHandlers({
    setRitualEntry,
    setBriefStep,
  });

  const handleDepthPickerDeep = useCallback(() => {
    if (!requirePro('deep_pause')) return;
    depthPickerOnDeep();
  }, [requirePro, depthPickerOnDeep]);

  const { handleMoodSelect } = usePauseSessionInitialMoodHandlers({
    pauseInstanceId,
    t,
    lastFeelLogKeyRef,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
    setSelectedBriefFace,
  });

  const { onFeelTilesSelect } = usePauseSessionFeelTilesSelect({
    handleMoodSelect,
    isBriefRitual: ritualEntry === 'brief',
  });

  usePauseSessionRitualStorageSync({
    pauseInstanceId,
    setRitualEntry,
    setBriefStep,
    setBriefIntegrateDone,
    setSelectedBriefFace,
  });

  usePauseSessionPersistToStorage({
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
    ritualEntry,
    briefStep,
    briefIntegrateDone,
    selectedBriefFace,
  });

  const [swipeDirection, setSwipeDirection] = useState<'forward' | 'back'>('forward');

  const { goToStep } = usePauseSessionGoToStep({
    step,
    setSwipeDirection,
    setStep,
  });

  const { handleFrameImDone } = usePauseShiftFrameDoneHandler({
    pauseInstanceId,
    t,
    lastShiftLogKeyRef,
    setFrameDone,
    setMoodAfterDone,
    goToStep,
  });

  const { goBack } = usePauseSessionGoBack({
    ritualEntry,
    briefStep,
    step,
    setSwipeDirection,
    setBriefStep,
    setBriefIntegrateDone,
    setStep,
  });

  const decidingRef = useRef(false);
  const [soundMuted, setSoundMuted] = useState(true);

  const {
    breathingRef,
    breathTimedActive,
    setBreathTimedActive,
    breathFirstTimedPatternStarted,
    breathSecondTimedPatternStarted,
    setBreathFirstTimedPatternStarted,
    setBreathSecondTimedPatternStarted,
    trackBreathTimedActive,
    handleBriefRepeatBreaths,
    handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat,
  } = usePauseSessionBreathUi({
    ritualEntry,
    briefStep,
    step,
    setSwipeDirection,
    setBriefIntegrateDone,
    setBriefStep,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
  });

  const { handlePauseHeaderBack } = usePauseSessionHeaderBackHandler({
    breathingRef,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathingFirstCompleted,
    breathingSecondCompleted,
    goBack,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBreathSecondTimedPatternStarted,
  });

  const showPauseHeaderBack = isPauseSessionHeaderBackVisible({
    phase,
    ritualEntry,
    briefStep,
    step,
    breathTimedActive,
    breathFirstTimedPatternStarted,
    breathSecondTimedPatternStarted,
    breathingFirstCompleted,
    breathingSecondCompleted,
  });

  const {
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    handleBriefIntegrateComplete,
  } = usePauseSessionBreathStepHandlers({
    goToStep,
    ritualEntry,
    briefStep,
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBriefStep,
    setBriefIntegrateDone,
  });

  const { handleBriefSwitchToDeepPause } = usePauseSessionBriefToDeep({
    subLoading,
    subscribed,
    ritualEntry,
    pauseInstanceId,
    t,
    requirePro,
    setRitualEntry,
    setSwipeDirection,
    setStep,
    setBriefStep,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setBreathTimedActive,
    setBreathFirstTimedPatternStarted,
    setFrameDone,
    setMoodAfterDone,
  });

  const reflectGenEnabled = isPauseReflectGenerationEnabled(ritualEntry, step);

  const {
    reflectionMessage: generatedReflectionMessage,
    loading: reflectionLoading,
    error: reflectionError,
    retry: retryReflection,
  } = usePauseReflectGeneration({
    pauseInstanceId,
    context,
    initialReflectionMessage: message,
    severityAbsPct: Math.abs(btcData?.changePercent ?? 0),
    enabled: reflectGenEnabled,
  });

  const effectiveReflectionMessage = generatedReflectionMessage.trim() || message;

  const { handleDecide } = usePauseSessionDecideHandler({
    decidingRef,
    pauseInstanceId,
    t,
    refreshSubscription,
    setDecision,
    dismissMessage,
    setPauseImpactData,
    setPhase,
    context,
    selectedMood,
    selectedMoodAfter,
    ritualEntry,
    breathingFirstCompleted,
    breathingSecondCompleted,
    feelIntensity,
    shiftIntensity,
    reflectionMessage: effectiveReflectionMessage,
    haiku: companions.haiku ?? null,
  });

  const { depthContextLine } = usePauseSessionDepthAndBriefCopy({
    t,
    btcData,
    trackedAssetId,
    ritualEntry,
  });

  const stepTransition = usePauseSessionStepTransition({
    swipeDirection,
    prefersReducedMotion,
  });

  const sessionOnPicker = isPauseSessionDepthPickerActive({
    phase,
    ritualEntry,
    hasShellMessage: hasCoalescedShellSession,
  });

  const scaffoldRitualDerived = buildPauseSessionScaffoldRitualDerived({
    ritualEntry,
    step,
    briefStep: ritualEntry === 'brief' ? briefStep : undefined,
    severity,
    moodDone,
    breathingFirstCompleted,
    breathingSecondCompleted,
    t,
  });

  const { briefStepperSlot, engagedOpenMaxCountdownSlot } = usePauseSessionScaffoldChromeSlots({
    phase,
    ritualEntry,
    briefStep,
    fetchedInstance,
  });

  const { briefRitual, deepRitual } = buildPauseSessionScaffoldRitualPayloads({
    briefStep,
    step,
    stepTransition,
    moodDone,
    selectedMood,
    selectedBriefFace,
    feelIntensity,
    onFeelTilesSelect,
    setBriefStep,
    breathingRef,
    mantra,
    severity,
    breathingFirstCompleted,
    breathingSecondCompleted,
    setBreathTimedActive: trackBreathTimedActive,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    soundMuted,
    briefIntegrateDone,
    handleBriefIntegrateComplete,
    handleBriefRepeatBreaths,
    handleBriefSwitchToDeepPause,
    handleDecide,
    goToStep,
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    prefersReducedMotion: !!prefersReducedMotion,
    companions,
    companionPrefs,
    pauseInstanceId,
    context,
    message: effectiveReflectionMessage,
    isFavorite,
    toggleFavorite,
    subscribed,
    handleFrameImDone,
    handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat,
    severityAbsPct: Math.abs(btcData?.changePercent ?? 0),
    reflectionLoading,
    reflectionError,
    onReflectionRetry: retryReflection,
  });


  return {
    t,
    subLoading,
    canEngagePause,
    entitlement,
    checkoutLoading,
    trialLoading,
    startReactivationCheckout,
    ensureTrial,
    refreshSubscription,
    handleReturn,
    leaveWithPendingOpen,
    setLeaveWithPendingOpen,
    pending,
    leaveSheetBusy,
    confirmLeavePauseSession,
    setRitualEntry,
    setBriefStep,
    setStep,
    handlePendingAdoptFromLeaveSheet,
    handleDeclinePendingFromLeaveSheet,
    hasCoalescedShellSession,
    phase,
    waitingForFetch,
    fetchFailed,
    hydration,
    profileLoaded,
    sessionOnPicker,
    depthContextLine,
    depthPickerOnBrief,
    handleDepthPickerDeep,
    subscribed,
    requestExitPauseBeforeDone,
    scaffoldRitualDerived,
    engagedOpenMaxCountdownSlot,
    curtainLifted,
    prefersReducedMotion,
    handlePauseSessionChromeClose,
    step,
    handlePauseHeaderBack,
    showPauseHeaderBack,
    briefStepperSlot,
    breathSecondLabelVariant,
    soundMuted,
    setSoundMuted,
    ritualEntry,
    briefRitual,
    deepRitual,
    decision,
    handleBriefSaveToJourney,
    pauseImpactData,
    pauseInstanceIdForTerminal,
  };
}
