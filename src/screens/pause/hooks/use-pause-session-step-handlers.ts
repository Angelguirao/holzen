import { useCallback } from 'react';
import { usePauseFavoriteToggle } from '@/screens/pause/hooks/use-pause-favorite-toggle';
import { usePauseShiftFrameDoneHandler } from '@/screens/pause/hooks/use-pause-shift-frame-done-handler';
import { usePauseSessionMoodAndPersist } from '@/screens/pause/hooks/use-pause-session-mood-and-persist';
import { usePauseSessionBreathHandlers } from '@/screens/pause/hooks/use-pause-session-breath-handlers';
import { usePauseSessionReflectAndDecide } from '@/screens/pause/hooks/use-pause-session-reflect-and-decide';
import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';
import type { usePauseSessionShellRitual } from '@/screens/pause/hooks/use-pause-session-shell-ritual';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;
type PauseSessionShellRitual = ReturnType<typeof usePauseSessionShellRitual>;

/** Mood, breath, reflect/decide, and chrome handlers (inputs for scaffold assembly). */
export function usePauseSessionStepHandlers(
  p: PauseSessionProviders,
  { shell, ritual }: PauseSessionShellRitual,
) {
  const {
    t,
    handleReturn,
    dismissMessage,
    btcData,
    subscribed,
    subLoading,
    requirePro,
    refreshSubscription,
  } = p;

  const {
    restored,
    message,
    context,
    pauseInstanceId,
    companions,
    companionPrefs,
    severity,
    fetchedInstance,
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
    hydration,
    fetchFailed,
    waitingForFetch,
  } = shell;

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
  } = ritual;

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

  const mood = usePauseSessionMoodAndPersist({
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

  const breath = usePauseSessionBreathHandlers({
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
    lastShiftLogKeyRef: mood.lastShiftLogKeyRef,
    setFrameDone,
    setMoodAfterDone,
    goToStep: breath.goToStep,
  });

  const reflect = usePauseSessionReflectAndDecide({
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

  return {
    shell: {
      handleReturn,
      leaveWithPendingOpen,
      setLeaveWithPendingOpen,
      pending,
      leaveSheetBusy,
      confirmLeavePauseSession,
      requestExitPauseBeforeDone,
      handleDeclinePendingFromLeaveSheet,
      handlePendingAdoptFromLeaveSheet,
      hasCoalescedShellSession,
      hydration,
      fetchFailed,
      waitingForFetch,
      pauseInstanceIdForTerminal,
      fetchedInstance,
      companions,
      companionPrefs,
      severity,
      context,
      pauseInstanceId,
    },
    ritual: {
      step,
      setStep,
      setRitualEntry,
      setBriefStep,
      phase,
      curtainLifted,
      soundMuted,
      setSoundMuted,
      ritualEntry,
      decision,
      pauseImpactData,
      isFavorite,
      moodDone,
      selectedMood,
      selectedBriefFace,
      feelIntensity,
      briefStep,
      briefIntegrateDone,
      breathingFirstCompleted,
      setBreathingFirstCompleted,
      breathingSecondCompleted,
      setBreathingSecondCompleted,
      swipeDirection,
    },
    mood,
    breath,
    reflect,
    toggleFavorite,
    handlePauseSessionChromeClose,
    handleFrameImDone,
    subscribed,
  };
}
