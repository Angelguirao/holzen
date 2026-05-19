import { useMemo, type ReactNode } from 'react';
import { PauseBriefProgress } from '@/screens/pause/components/PauseBriefProgress';
import { PauseEngagedOpenMaxCountdown } from '@/screens/pause/components/PauseEngagedOpenMaxCountdown';
import type { BriefPauseStep, FetchedPauseInstance, RitualDepth } from '@/features/pause/public';

export interface UsePauseSessionScaffoldChromeSlotsParams {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  fetchedInstance: FetchedPauseInstance | null;
}

/** Scaffold header slots: brief macro stepper + engaged open-max countdown. */
export function usePauseSessionScaffoldChromeSlots({
  phase,
  ritualEntry,
  briefStep,
  fetchedInstance,
}: UsePauseSessionScaffoldChromeSlotsParams): {
  briefStepperSlot: ReactNode;
  engagedOpenMaxCountdownSlot: ReactNode;
} {
  const briefStepperSlot = useMemo(
    () => (ritualEntry === 'brief' ? <PauseBriefProgress currentStep={briefStep} /> : undefined),
    [ritualEntry, briefStep],
  );

  const engagedOpenMaxCountdownSlot = useMemo(() => {
    if (phase !== 'session') return undefined;
    const engagedAt = fetchedInstance?.engaged_at;
    if (fetchedInstance?.db_state !== 'engaged' || !engagedAt) return undefined;
    return <PauseEngagedOpenMaxCountdown engagedAtIso={engagedAt} />;
  }, [phase, fetchedInstance?.db_state, fetchedInstance?.engaged_at]);

  return { briefStepperSlot, engagedOpenMaxCountdownSlot };
}
