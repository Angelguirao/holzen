import {
  usePauseSessionFlowThroughSteps,
  usePauseSessionFlowWithChrome,
  type PauseSessionProviders,
} from '@/features/pause/public-hooks';
import { usePauseSessionScaffoldChromeSlots } from '@/screens/pause/hooks/use-pause-session-scaffold-chrome-slots';

/**
 * `/pause` flow conductor: core steps in presentation, chrome slots in screens.
 */
export function usePauseSessionFlow(p: PauseSessionProviders) {
  const { step } = usePauseSessionFlowThroughSteps(p);
  const chrome = usePauseSessionScaffoldChromeSlots({
    phase: step.ritual.phase,
    ritualEntry: step.ritual.ritualEntry,
    briefStep: step.ritual.briefStep,
    fetchedInstance: step.shell.fetchedInstance,
  });

  return usePauseSessionFlowWithChrome(p, step, chrome);
}
