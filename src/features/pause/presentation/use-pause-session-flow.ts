import { usePauseSessionFlowCore } from './use-pause-session-flow-core';
import { usePauseSessionScaffoldVm } from './use-pause-session-scaffold-vm';
import { usePauseSessionRitualSurface } from './use-pause-session-ritual-surface';
import type { PauseSessionProviders } from './session/pause-session-providers-types';
import type { PauseSessionScaffoldVmChromeSlots } from './session/pause-session-scaffold-vm-types';
import type { PauseSessionStepHandlersResult } from './use-pause-session-step-handlers';
import type { PauseSessionRitualSurfaceResult } from './use-pause-session-ritual-surface';

/**
 * Step handlers, scaffold VM, and ritual surface merge.
 * Route chrome slots are built in screens and passed as `chrome`.
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
