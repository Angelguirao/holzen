/**
 * Presentation I/O for `/pause` breath segment RPC, timed breathing UI, and breath hydration.
 * Ritual audio cues import from `ritual-audio` (off `pause-ritual-audio-breathe-flow` CI anchor).
 */
export { applyBreathSegmentLogOutcome } from '@/features/pause/domain/ritual/breathe/apply-breath-segment-log-outcome';
export { initialBreathSegmentRpcLoggedFlagsFromRestored } from '@/features/pause/domain/ritual/breathe/initial-breath-segment-rpc-flags';
export {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
} from '@/features/pause/domain/ritual/breathe/restored-breath-ritual-state';
export {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
} from '@/features/pause/domain/ritual/breathe/phase-advance';
export type { PauseBreathingPhase } from '@/features/pause/domain/ritual/breathe/pause-breathing-phase';
export {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from '@/features/pause/application/use-cases/ritual/breathe/ritual-audio';
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from '@/features/pause/domain/ritual/breathe/breath-second-label-variant';

import { invalidateCompanionUiCompletionQuery } from '@/features/pause/application/queries/companion-ui-completion-query-key';
import {
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  type BreathSegmentLogDeps,
} from '@/features/pause/application/use-cases/ritual/breathe/run-breath-segment-log';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/** Shared invalidation after successful `breath_completed` RPC. */
export const pauseBreathSegmentLogDeps: BreathSegmentLogDeps = {
  onSegmentLogged: invalidateCompanionUiCompletionQuery,
};

/** Default port + use case: first `breath_completed` segment (deduped). */
export function pauseEnsureBreathSegment1Logged(
  input: Parameters<typeof runEnsureBreathSegment1Logged>[1],
  deps: BreathSegmentLogDeps = pauseBreathSegmentLogDeps,
): ReturnType<typeof runEnsureBreathSegment1Logged> {
  return runEnsureBreathSegment1Logged(supabasePauseRepository, input, deps);
}

/** Default port + use case: second `breath_completed` segment (deduped). */
export function pauseEnsureBreathSegment2Logged(
  input: Parameters<typeof runEnsureBreathSegment2Logged>[1],
  deps: BreathSegmentLogDeps = pauseBreathSegmentLogDeps,
): ReturnType<typeof runEnsureBreathSegment2Logged> {
  return runEnsureBreathSegment2Logged(supabasePauseRepository, input, deps);
}

/** Default port + use case: segment 1 skip (`skipped: true`). */
export function pauseLogBreathSegment1Skipped(
  input: Parameters<typeof runLogBreathSegment1Skipped>[1],
  deps: BreathSegmentLogDeps = pauseBreathSegmentLogDeps,
): ReturnType<typeof runLogBreathSegment1Skipped> {
  return runLogBreathSegment1Skipped(supabasePauseRepository, input, deps);
}

/** Default port + use case: segment 2 skip (`skipped: true`). */
export function pauseLogBreathSegment2Skipped(
  input: Parameters<typeof runLogBreathSegment2Skipped>[1],
  deps: BreathSegmentLogDeps = pauseBreathSegmentLogDeps,
): ReturnType<typeof runLogBreathSegment2Skipped> {
  return runLogBreathSegment2Skipped(supabasePauseRepository, input, deps);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseEnsureBreathSegment1LoggedWithRepository(
  repository: PauseRepository,
  input: Parameters<typeof runEnsureBreathSegment1Logged>[1],
  deps?: BreathSegmentLogDeps,
): ReturnType<typeof runEnsureBreathSegment1Logged> {
  return runEnsureBreathSegment1Logged(repository, input, deps);
}

export function pauseEnsureBreathSegment2LoggedWithRepository(
  repository: PauseRepository,
  input: Parameters<typeof runEnsureBreathSegment2Logged>[1],
  deps?: BreathSegmentLogDeps,
): ReturnType<typeof runEnsureBreathSegment2Logged> {
  return runEnsureBreathSegment2Logged(repository, input, deps);
}

export function pauseLogBreathSegment1SkippedWithRepository(
  repository: PauseRepository,
  input: Parameters<typeof runLogBreathSegment1Skipped>[1],
  deps?: BreathSegmentLogDeps,
): ReturnType<typeof runLogBreathSegment1Skipped> {
  return runLogBreathSegment1Skipped(repository, input, deps);
}

export function pauseLogBreathSegment2SkippedWithRepository(
  repository: PauseRepository,
  input: Parameters<typeof runLogBreathSegment2Skipped>[1],
  deps?: BreathSegmentLogDeps,
): ReturnType<typeof runLogBreathSegment2Skipped> {
  return runLogBreathSegment2Skipped(repository, input, deps);
}
