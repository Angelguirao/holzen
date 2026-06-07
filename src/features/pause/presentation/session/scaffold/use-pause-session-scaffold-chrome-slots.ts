import { useMemo, type ReactNode } from 'react';
import { resolvePauseOpenMaxAnchorAt } from '@/features/pause/domain/pause-open-max-anchor';
import type { FetchedPauseInstance } from '@/features/pause/domain/session-model';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { PauseScaffoldChromeRegistry } from './pause-session-scaffold-vm-types';

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
    if (fetchedInstance?.db_state !== 'engaged' || !fetchedInstance.created_at) return undefined;
    const anchor = resolvePauseOpenMaxAnchorAt({
      state: 'engaged',
      source: fetchedInstance.source,
      engaged_at: fetchedInstance.engaged_at ?? null,
      created_at: fetchedInstance.created_at,
      metadata: fetchedInstance.metadata,
    });
    if (!anchor) return undefined;
    return registry.renderEngagedOpenMaxCountdown(anchor);
  }, [
    registry,
    phase,
    fetchedInstance?.db_state,
    fetchedInstance?.engaged_at,
    fetchedInstance?.created_at,
    fetchedInstance?.source,
    fetchedInstance?.metadata,
  ]);

  return { briefStepperSlot, engagedOpenMaxCountdownSlot };
}
