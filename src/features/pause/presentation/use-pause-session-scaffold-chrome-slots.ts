import { useMemo, type ReactNode } from 'react';
import type { FetchedPauseInstance } from '@/features/pause/public';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/public-hooks';
import type { PauseScaffoldChromeRegistry } from './session/pause-session-scaffold-vm-types';

export type UsePauseSessionScaffoldChromeSlotsParams = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  fetchedInstance: FetchedPauseInstance | null;
};

/** Scaffold header slots via route registry (avoids features → screens imports). */
export function usePauseSessionScaffoldChromeSlots(
  registry: PauseScaffoldChromeRegistry,
  {
    phase,
    ritualEntry,
    briefStep,
    fetchedInstance,
  }: UsePauseSessionScaffoldChromeSlotsParams,
): {
  briefStepperSlot: ReactNode;
  engagedOpenMaxCountdownSlot: ReactNode;
} {
  const briefStepperSlot = useMemo(
    () => (ritualEntry === 'brief' ? registry.renderBriefStepper(briefStep) : undefined),
    [registry, ritualEntry, briefStep],
  );

  const engagedOpenMaxCountdownSlot = useMemo(() => {
    if (phase !== 'session') return undefined;
    const engagedAt = fetchedInstance?.engaged_at;
    if (fetchedInstance?.db_state !== 'engaged' || !engagedAt) return undefined;
    return registry.renderEngagedOpenMaxCountdown(engagedAt);
  }, [registry, phase, fetchedInstance?.db_state, fetchedInstance?.engaged_at]);

  return { briefStepperSlot, engagedOpenMaxCountdownSlot };
}
