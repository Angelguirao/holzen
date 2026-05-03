import type { PauseSessionHydrationState } from '@/lib/pause-session-hydration';
import type { BriefPauseStep, PersistedSession, RitualDepth } from '@/lib/pause-session-storage';
import {
  initialBriefPauseStepFromRestored,
  initialPhaseFromRestored,
  initialRitualEntry,
} from '@/lib/pause-session-step-map';

/** Payload for `[holzen:pause] mount` (see `usePauseSessionMountLog`). No message text or full ids. */
export type PauseSessionMountLogParams = {
  pauseInstanceIdPrefix: string | null;
  hasNavMessage: boolean;
  restoredFromStorage: boolean;
  hydrationStatus: PauseSessionHydrationState['status'];
  ritualEntryInitial: RitualDepth | 'picker';
  briefStepInitial: BriefPauseStep;
  phaseInitial: 'session' | 'done';
};

export type BuildPauseSessionMountLogParamsInput = {
  restored: PersistedSession | null;
  fetchPauseInstanceId: string | null;
  navPauseInstanceId: string | null;
  navReflectionMessage: string;
  hydrationStatus: PauseSessionHydrationState['status'];
};

/** Derive mount-only pause diagnostics from shell + nav (first paint). */
export function buildPauseSessionMountLogParams(
  input: BuildPauseSessionMountLogParamsInput,
): PauseSessionMountLogParams {
  const { restored, fetchPauseInstanceId, navPauseInstanceId, navReflectionMessage, hydrationStatus } = input;
  return {
    pauseInstanceIdPrefix: (fetchPauseInstanceId ?? navPauseInstanceId)?.slice(0, 8) ?? null,
    hasNavMessage: navReflectionMessage.length > 0,
    restoredFromStorage: restored !== null,
    hydrationStatus,
    ritualEntryInitial: initialRitualEntry(restored),
    briefStepInitial: initialBriefPauseStepFromRestored(restored),
    phaseInitial: initialPhaseFromRestored(restored),
  };
}
