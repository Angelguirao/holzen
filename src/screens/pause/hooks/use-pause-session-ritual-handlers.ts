import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';
import type { PauseSessionShellRitualResult } from '@/features/pause/public-hooks';
import { usePauseSessionScaffoldVm } from '@/screens/pause/hooks/use-pause-session-scaffold-vm';
import { usePauseSessionStepHandlers } from '@/screens/pause/hooks/use-pause-session-step-handlers';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;

/** Composes step handlers + scaffold VM for the pause session ritual surface. */
export function usePauseSessionRitualHandlers(
  p: PauseSessionProviders,
  shellRitual: PauseSessionShellRitualResult,
) {
  const { prefersReducedMotion } = p;
  const step = usePauseSessionStepHandlers(p, shellRitual);
  const scaffoldVm = usePauseSessionScaffoldVm(p, step);
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
