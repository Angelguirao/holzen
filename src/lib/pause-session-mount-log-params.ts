import type { PauseSessionHydrationState } from '@/lib/pause-session-hydration';
import type { BriefPauseStep, PersistedSession, RitualDepth } from '@/lib/pause-session-storage';
import {
  initialBriefPauseStepFromRestored,
  initialPhaseFromRestored,
  initialRitualEntry,
} from '@/lib/pause-session-step-map';

/**
 * First-paint snapshot for `[holzen:pause] mount` (see `usePauseSessionMountLog`).
 *
 * **Browser logging:** `docs/ops/logging-strategy.md` (Holzen console / flow tracing; fields here are non-PII).
 * **Code map:** `docs/systems/pause-system.md` section 10 (Related docs and code).
 */

/** Payload for `holzenLog.pause('mount', …)` — id prefix, booleans, hydration + restore hints only. */
export type PauseSessionMountLogParams = {
  pauseInstanceIdPrefix: string | null;
  hasNavMessage: boolean;
  restoredFromStorage: boolean;
  hydrationStatus: PauseSessionHydrationState['status'];
  ritualEntryInitial: RitualDepth | 'picker';
  briefStepInitial: BriefPauseStep;
  phaseInitial: 'session' | 'done';
};

/** Inputs from `PauseSession` shell + nav used once to build `PauseSessionMountLogParams`. */
export type BuildPauseSessionMountLogParamsInput = {
  restored: PersistedSession | null;
  fetchPauseInstanceId: string | null;
  navPauseInstanceId: string | null;
  navReflectionMessage: string;
  hydrationStatus: PauseSessionHydrationState['status'];
};

/** Derive mount-only pause diagnostics from shell + nav (first committed paint). */
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
