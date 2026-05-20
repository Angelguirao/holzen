import { usePauseSessionFlowCore } from './use-pause-session-flow-core';
import { usePauseSessionScaffoldVm } from './use-pause-session-scaffold-vm';
import { usePauseSessionRitualSurface } from '../use-pause-session-ritual-surface';
import { usePauseSessionScaffoldChromeSlots } from './use-pause-session-scaffold-chrome-slots';
import type { PauseSessionProviders } from './pause-session-providers-types';
import type {
  PauseScaffoldChromeRegistry,
  PauseSessionScaffoldVmChromeSlots,
} from './pause-session-scaffold-vm-types';
import type { PauseSessionStepHandlersResult } from './use-pause-session-step-handlers';
import type { PauseSessionRitualSurfaceResult } from '../use-pause-session-ritual-surface';

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
): PauseSessionRitualSurfaceResult {
  const scaffoldVm = usePauseSessionScaffoldVm(p, step, chrome);
  return usePauseSessionRitualSurface({ prefersReducedMotion: p.prefersReducedMotion }, step, scaffoldVm);
}

/** Shell hydrate, ritual state, step handlers (before chrome slots). */
export function usePauseSessionFlowThroughSteps(p: PauseSessionProviders) {
  return usePauseSessionFlowCore(p);
}
