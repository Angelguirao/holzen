import type { PauseSessionScaffoldVmResult } from './use-pause-session-scaffold-vm';
import type { PauseSessionStepHandlersResult } from './session/use-pause-session-step-handlers';

export type PauseSessionRitualSurfaceMotionSlice = {
  prefersReducedMotion: boolean | null;
};

/** Merges step handlers + scaffold VM into props for the pause session ritual surface. */
export function usePauseSessionRitualSurface(
  motion: PauseSessionRitualSurfaceMotionSlice,
  step: PauseSessionStepHandlersResult,
  scaffoldVm: PauseSessionScaffoldVmResult,
) {
  const { prefersReducedMotion } = motion;
  const { shell, ritual } = step;

  return {
    handleReturn: shell.handleReturn,
    leaveWithPendingOpen: shell.leaveWithPendingOpen,
    setLeaveWithPendingOpen: shell.setLeaveWithPendingOpen,
    pending: shell.pending,
    leaveSheetBusy: shell.leaveSheetBusy,
    confirmLeavePauseSession: shell.confirmLeavePauseSession,
    setRitualEntry: ritual.setRitualEntry,
    setBriefStep: ritual.setBriefStep,
    setStep: ritual.setStep,
    handlePendingAdoptFromLeaveSheet: shell.handlePendingAdoptFromLeaveSheet,
    handleDeclinePendingFromLeaveSheet: shell.handleDeclinePendingFromLeaveSheet,
    hasCoalescedShellSession: shell.hasCoalescedShellSession,
    phase: ritual.phase,
    waitingForFetch: shell.waitingForFetch,
    fetchFailed: shell.fetchFailed,
    hydration: shell.hydration,
    sessionOnPicker: scaffoldVm.sessionOnPicker,
    depthContextLine: scaffoldVm.depthContextLine,
    depthPickerOnBrief: scaffoldVm.depthPickerOnBrief,
    handleDepthPickerDeep: scaffoldVm.handleDepthPickerDeep,
    subscribed: step.subscribed,
    requestExitPauseBeforeDone: shell.requestExitPauseBeforeDone,
    scaffoldRitualDerived: scaffoldVm.scaffoldRitualDerived,
    engagedOpenMaxCountdownSlot: scaffoldVm.engagedOpenMaxCountdownSlot,
    curtainLifted: ritual.curtainLifted,
    prefersReducedMotion,
    handlePauseSessionChromeClose: step.handlePauseSessionChromeClose,
    step: ritual.step,
    handlePauseHeaderBack: scaffoldVm.handlePauseHeaderBack,
    showPauseHeaderBack: scaffoldVm.showPauseHeaderBack,
    briefStepperSlot: scaffoldVm.briefStepperSlot,
    breathSecondLabelVariant: scaffoldVm.breathSecondLabelVariant,
    soundMuted: ritual.soundMuted,
    setSoundMuted: ritual.setSoundMuted,
    ritualEntry: ritual.ritualEntry,
    briefRitual: scaffoldVm.briefRitual,
    deepRitual: scaffoldVm.deepRitual,
    decision: ritual.decision,
    pauseImpactData: ritual.pauseImpactData,
    pauseInstanceIdForTerminal: shell.pauseInstanceIdForTerminal,
  };
}

export type PauseSessionRitualSurfaceResult = ReturnType<typeof usePauseSessionRitualSurface>;
