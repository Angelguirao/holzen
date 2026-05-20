import {
  usePauseSessionScaffoldVm as usePauseSessionScaffoldVmPresentation,
  type PauseSessionScaffoldVmResult,
} from '@/features/pause/public-hooks';
import { usePauseSessionScaffoldChromeSlots } from '@/screens/pause/hooks/use-pause-session-scaffold-chrome-slots';
import type { PauseSessionStepHandlersResult } from '@/features/pause/public-hooks';
import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;

/** Screen conductor: route chrome slots + presentation scaffold VM. */
export function usePauseSessionScaffoldVm(
  p: PauseSessionProviders,
  step: PauseSessionStepHandlersResult,
): PauseSessionScaffoldVmResult {
  const { briefStepperSlot, engagedOpenMaxCountdownSlot } = usePauseSessionScaffoldChromeSlots({
    phase: step.ritual.phase,
    ritualEntry: step.ritual.ritualEntry,
    briefStep: step.ritual.briefStep,
    fetchedInstance: step.shell.fetchedInstance,
  });

  return usePauseSessionScaffoldVmPresentation(p, step, {
    briefStepperSlot,
    engagedOpenMaxCountdownSlot,
  });
}
