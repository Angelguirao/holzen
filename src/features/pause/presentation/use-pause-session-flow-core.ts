import {
  usePauseSessionShellRitual,
  type PauseSessionShellRitualProvidersSlice,
  type PauseSessionShellRitualResult,
} from './use-pause-session-shell-ritual';
import {
  usePauseSessionStepHandlers,
  type PauseSessionStepHandlersProvidersSlice,
  type PauseSessionStepHandlersResult,
} from './session/use-pause-session-step-handlers';

export type PauseSessionFlowCoreProvidersSlice = PauseSessionShellRitualProvidersSlice &
  PauseSessionStepHandlersProvidersSlice;

export type PauseSessionFlowCoreResult = {
  shellRitual: PauseSessionShellRitualResult;
  step: PauseSessionStepHandlersResult;
};

/** Shell hydrate, ritual state, and step handlers — scaffold VM composed in the screen conductor. */
export function usePauseSessionFlowCore(
  p: PauseSessionFlowCoreProvidersSlice,
): PauseSessionFlowCoreResult {
  const shellRitual = usePauseSessionShellRitual(p);
  const step = usePauseSessionStepHandlers(p, shellRitual);
  return { shellRitual, step };
}
