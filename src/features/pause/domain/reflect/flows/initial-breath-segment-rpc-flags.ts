import { STEPS } from '@/features/pause/domain/pause-ritual-steps';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import { mapPersistedStep } from '@/features/pause/domain/session/map-persisted-step';

/**
 * When resuming from local storage past the first or second breath beat,
 * `presentation/reflect/flows/use-pause-breath-segment-rpc-loggers` must treat `breath_completed`
 * segment RPCs as already satisfied (refs start `true`).
 * Uses the same `mapPersistedStep` + `STEPS` order as initial `step` state in `PauseSession.tsx`.
 */
export function initialBreathSegmentRpcLoggedFlagsFromRestored(restored: PersistedSession | null): {
  segment1Logged: boolean;
  segment2Logged: boolean;
} {
  if (!restored) return { segment1Logged: false, segment2Logged: false };
  const restoredStep = mapPersistedStep(restored.step);
  const idx = STEPS.indexOf(restoredStep);
  return {
    segment1Logged: idx > STEPS.indexOf('breathe'),
    segment2Logged: idx > STEPS.indexOf('breath2'),
  };
}
