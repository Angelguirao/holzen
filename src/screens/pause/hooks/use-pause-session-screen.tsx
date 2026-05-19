/**
 * `/pause` route orchestration — wires shell, ritual state, step handlers, and scaffold props.
 * Screen map: docs/screens/pause.md · Product model: docs/systems/pause-system.md
 */
import { useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import { usePauseFavoriteToggle } from '@/screens/pause/hooks/use-pause-favorite-toggle';
import { usePauseShiftFrameDoneHandler } from '@/screens/pause/hooks/use-pause-shift-frame-done-handler';
import { usePauseSessionExitNavigation } from '@/screens/pause/hooks/use-pause-session-exit-navigation';
import { usePauseSessionMoodAndPersist } from '@/screens/pause/hooks/use-pause-session-mood-and-persist';
import { usePauseSessionRitualState } from '@/screens/pause/hooks/use-pause-session-ritual-state';
import { usePauseSessionScaffoldPresentation } from '@/screens/pause/hooks/use-pause-session-scaffold-presentation';
import { usePauseSessionBreathSecondLabelVariant } from '@/screens/pause/hooks/use-pause-session-breath-second-label-variant';
import { usePauseSessionTerminalEntryRedirect } from '@/screens/pause/hooks/use-pause-session-terminal-entry-redirect';
import { usePauseSessionShellBootstrap } from '@/screens/pause/hooks/use-pause-session-shell-bootstrap';
import { usePauseSessionBreathHandlers } from '@/screens/pause/hooks/use-pause-session-breath-handlers';
import { JOURNEY_PREFIX } from '@/lib/app-routes';
import { clearSession } from '@/features/pause/public';
import { usePauseSessionReflectAndDecide } from '@/screens/pause/hooks/use-pause-session-reflect-and-decide';

export function usePauseSessionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleReturn, handleClose } = usePauseSessionExitNavigation(navigate);
  const handleBriefSaveToJourney = useCallback(() => {
    clearSession();
    navigate(JOURNEY_PREFIX, { replace: true });
  }, [navigate]);
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

  const {
    restored,
    hydration,
    fetchPauseInstanceId,
    fetchedInstance,
    fetchFailed,
    resolved,
    message,
    context,
    pauseInstanceId,
    companions,
    companionPrefs,
    severity,
    pauseInstanceIdForTerminal,
    pending,
    leaveWithPendingOpen,
    setLeaveWithPendingOpen,
    leaveSheetBusy,
    confirmLeavePauseSession,
    requestExitPauseBeforeDone,
    handleDeclinePendingFromLeaveSheet,
    handlePendingAdoptFromLeaveSheet,
    hasCoalescedShellSession,
    waitingForFetch,
  } = usePauseSessionShellBootstrap({
    holzen: {
      message: holzenMessage,
      context: holzenContext,
      lastPauseInstanceId: holzenLastPauseInstanceId,
      companions: holzenCompanions,
      companionPrefs: holzenCompanionPrefs,
      severity: holzenSeverity,
    },
    navigate,
    resyncOpenPauseFromDb,
    handleClose,
    t,
  });

  const {
    step,
    setStep,
    phase,
    setPhase,
    decision,
    setDecision,
    isFavorite,
    setIsFavorite,
    moodDone,
    setMoodDone,
    moodAfterDone,
    setMoodAfterDone,
    selectedMood,
    setSelectedMood,
    selectedMoodAfter,
    setSelectedMoodAfter,
    feelIntensity,
    setFeelIntensity,
    shiftIntensity,
    setShiftIntensity,
    breathingFirstCompleted,
    setBreathingFirstCompleted,
    breathingSecondCompleted,
    setBreathingSecondCompleted,
    frameDone,
    setFrameDone,
    curtainLifted,
    pauseImpactData,
    setPauseImpactData,
    ritualEntry,
    setRitualEntry,
    briefStep,
    setBriefStep,
    briefIntegrateDone,
    setBriefIntegrateDone,
    selectedBriefFace,
    setSelectedBriefFace,
    swipeDirection,
    setSwipeDirection,
    soundMuted,
    setSoundMuted,
  } = usePauseSessionRitualState(restored);

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

  const { toggleFavorite } = usePauseFavoriteToggle({
    pauseInstanceId,
    isFavorite,
    setIsFavorite,
    subscribed,
    t,
  });

  const handlePauseSessionChromeClose = useCallback(() => {
    if (phase === 'done') {
      handleReturn();
    } else {
      requestExitPauseBeforeDone();
    }
  }, [phase, handleReturn, requestExitPauseBeforeDone]);

  const {
    lastShiftLogKeyRef,
    depthPickerOnBrief,
    handleDepthPickerDeep,
    onFeelTilesSelect,
  } = usePauseSessionMoodAndPersist({
    pauseInstanceId,
    t,
    requirePro,
    ritualEntry,
    message,
    context,
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
    briefStep,
    briefIntegrateDone,
    selectedBriefFace,
    setRitualEntry,
    setBriefStep,
    setBriefIntegrateDone,
    setSelectedBriefFace,
    setMoodDone,
    setSelectedMood,
    setFeelIntensity,
  });

  const {
    goToStep,
    breathingRef,
    trackBreathTimedActive,
    handleBriefRepeatBreaths,
    handleDeepFirstBreathRepeat,
    handleDeepSecondBreathRepeat,
    handlePauseHeaderBack,
    showPauseHeaderBack,
    handleContinueAfterFirstBreath,
    handleContinueAfterSecondBreath,
    handleSkipFirstBreath,
    handleSkipSecondBreath,
    handleBriefBreathContinue,
    handleBriefSkipBreath,
    handleBriefIntegrateComplete,
    handleBriefSwitchToDeepPause,
  } = usePauseSessionBreathHandlers({
    pauseInstanceId,
    restored,
    t,
    subLoading,
    subscribed,
    requirePro,
    phase,
    ritualEntry,
    briefStep,
    step,
    breathingFirstCompleted,
    breathingSecondCompleted,
    setSwipeDirection,
    setStep,
    setBriefStep,
    setBriefIntegrateDone,
    setBreathingFirstCompleted,
    setBreathingSecondCompleted,
    setRitualEntry,
    setFrameDone,
    setMoodAfterDone,
  });

  const { handleFrameImDone } = usePauseShiftFrameDoneHandler({
    pauseInstanceId,
    t,
    lastShiftLogKeyRef,
    setFrameDone,
    setMoodAfterDone,
    goToStep,
  });

  const {
    effectiveReflectionMessage,
    reflectionLoading,
    reflectionError,
    retryReflection,
    handleDecide,
  } = usePauseSessionReflectAndDecide({
    t,
    ritualEntry,
    step,
    pauseInstanceId,
    context,
    message,
    btcData,
    companionsHaiku: companions.haiku ?? null,
    dismissMessage,
    refreshSubscription,
    setDecision,
    setPauseImpactData,
    setPhase,
    selectedMood,
    selectedMoodAfter,
    breathingFirstCompleted,
    breathingSecondCompleted,
    feelIntensity,
    shiftIntensity,
  });

  const {
    depthContextLine,
    sessionOnPicker,
    briefStepperSlot,
    engagedOpenMaxCountdownSlot,
    scaffoldRitualDerived,
    briefRitual,
    deepRitual,
  } = usePauseSessionScaffoldPresentation({
    t,
    btcData,
    trackedAssetId,
    ritualEntry,
    phase,
    hasCoalescedShellSession,
    fetchedInstance,
    swipeDirection,
    prefersReducedMotion,
    briefStep,
    step,
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
    prefersReducedMotion,
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
