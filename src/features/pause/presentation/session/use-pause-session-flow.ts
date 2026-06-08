import { usePauseSessionFlowCore } from './use-pause-session-flow-core';
import { usePauseSessionScaffoldVm } from './scaffold/use-pause-session-scaffold-vm';
import { usePauseSessionRitualSurface } from './use-pause-session-ritual-surface';
import { usePauseSessionScaffoldChromeSlots } from './scaffold/use-pause-session-scaffold-chrome-slots';
import { usePauseSessionInactivitySheet, type PauseSessionInactivitySheetSlice } from './use-pause-session-inactivity-sheet';
import type { PauseSessionProviders } from './pause-session-providers-types';
import type {
  PauseScaffoldChromeRegistry,
  PauseSessionScaffoldVmChromeSlots,
} from './scaffold/pause-session-scaffold-vm-types';
import type { PauseSessionStepHandlersResult } from './use-pause-session-step-handlers';
import type { PauseSessionRitualSurfaceResult } from './use-pause-session-ritual-surface';

/** `/pause` flow: core steps + chrome slots from route registry. */
export function usePauseSessionFlow(
  p: PauseSessionProviders,
  chromeRegistry: PauseScaffoldChromeRegistry,
) {
  const { step } = usePauseSessionFlowThroughSteps(p);
  const chrome = usePauseSessionScaffoldChromeSlots(chromeRegistry, {
    phase: step.ritual.phase,
    ritualEntry: step.ritual.ritualEntry,
    briefStep: step.ritual.briefStep,
    fetchedInstance: step.shell.fetchedInstance,
  });

  return usePauseSessionFlowWithChrome(p, step, chrome);
}

/**
 * Step handlers, scaffold VM, and ritual surface merge.
 * Route chrome slots are built via `usePauseSessionScaffoldChromeSlots` + registry.
 */
export function usePauseSessionFlowWithChrome(
  p: PauseSessionProviders,
  step: PauseSessionStepHandlersResult,
  chrome: PauseSessionScaffoldVmChromeSlots,
): PauseSessionRitualSurfaceResult & PauseSessionInactivitySheetSlice {
  const scaffoldVm = usePauseSessionScaffoldVm(p, step, chrome);
  const ritualSurface = usePauseSessionRitualSurface(
    { prefersReducedMotion: p.prefersReducedMotion, navigate: p.navigate },
    step,
    scaffoldVm,
  );
  const { ritual, shell, breath } = step;
  const inactivity = usePauseSessionInactivitySheet({
    phase: ritual.phase,
    ritualEntry: ritual.ritualEntry,
    leaveWithPendingOpen: shell.leaveWithPendingOpen,
    breathTimedActive: breath.breathTimedActive,
    hasCoalescedShellSession: shell.hasCoalescedShellSession,
    dismissOpenPauseFromWidget: p.dismissOpenPauseFromWidget,
    handleReturn: ritualSurface.handleReturn,
    setStep: ritual.setStep,
    setBriefStep: ritual.setBriefStep,
    setPhase: ritual.setPhase,
    setMoodDone: ritual.setMoodDone,
    setMoodAfterDone: ritual.setMoodAfterDone,
    setSelectedMood: ritual.setSelectedMood,
    setSelectedMoodAfter: ritual.setSelectedMoodAfter,
    setFeelIntensity: ritual.setFeelIntensity,
    setShiftIntensity: ritual.setShiftIntensity,
    setBreathingFirstCompleted: ritual.setBreathingFirstCompleted,
    setBreathingSecondCompleted: ritual.setBreathingSecondCompleted,
    setFrameDone: ritual.setFrameDone,
    setBriefIntegrateDone: ritual.setBriefIntegrateDone,
    setDecision: ritual.setDecision,
    setSwipeDirection: ritual.setSwipeDirection,
    setBreathTimedActive: breath.setBreathTimedActive,
    setBreathFirstTimedPatternStarted: breath.setBreathFirstTimedPatternStarted,
    setBreathSecondTimedPatternStarted: breath.setBreathSecondTimedPatternStarted,
    breathingRef: breath.breathingRef,
  });
  return { ...ritualSurface, ...inactivity };
}

/** Shell hydrate, ritual state, step handlers (before chrome slots). */
export function usePauseSessionFlowThroughSteps(p: PauseSessionProviders) {
  return usePauseSessionFlowCore(p);
}
