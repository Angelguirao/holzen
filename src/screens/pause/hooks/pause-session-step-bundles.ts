import type { usePauseSessionShellRitual } from '@/screens/pause/hooks/use-pause-session-shell-ritual';

type PauseSessionShellRitual = ReturnType<typeof usePauseSessionShellRitual>;
type Shell = PauseSessionShellRitual['shell'];
type Ritual = PauseSessionShellRitual['ritual'];

/** Subset of shell fields passed to scaffold VM and ritual handlers. */
export function buildPauseSessionStepShellBundle(
  shell: Shell,
  sessionChrome: { handleReturn: () => void },
) {
  const {
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
  } = shell;

  return {
    handleReturn: sessionChrome.handleReturn,
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
  };
}

/** Subset of ritual fields passed to scaffold presentation. */
export function buildPauseSessionStepRitualBundle(ritual: Ritual) {
  const {
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
  } = ritual;

  return {
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
  };
}
