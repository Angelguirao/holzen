import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  breathCompletedSegment1Payload,
  breathCompletedSegment2Payload,
  type BreathCompletedSegment1Options,
} from './breath-completed-payload';

export type RunBreathSegmentLogResult =
  | { status: 'success'; markSegmentLogged: true }
  | { status: 'already_logged' }
  | { status: 'no_instance' }
  | { status: 'sync_failed' };

export type BreathSegmentLogDeps = {
  onSegmentLogged?: (pauseInstanceId: string) => void;
};

function afterSuccessfulLog(
  pauseInstanceId: string,
  deps?: BreathSegmentLogDeps,
): RunBreathSegmentLogResult {
  deps?.onSegmentLogged?.(pauseInstanceId);
  return { status: 'success', markSegmentLogged: true };
}

/** First `breath_completed` RPC (deduped per segment ref). */
export async function runEnsureBreathSegment1Logged(
  repository: PauseRepository,
  input: {
    pauseInstanceId: string | null;
    segmentAlreadyLogged: boolean;
    briefRitual?: boolean;
  },
  deps?: BreathSegmentLogDeps,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };
  if (input.segmentAlreadyLogged) return { status: 'already_logged' };

  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'breath_completed',
      payload: breathCompletedSegment1Payload({ briefRitual: !!input.briefRitual }),
    });
    return afterSuccessfulLog(input.pauseInstanceId, deps);
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Second `breath_completed` RPC (deduped per segment ref). */
export async function runEnsureBreathSegment2Logged(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; segmentAlreadyLogged: boolean },
  deps?: BreathSegmentLogDeps,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };
  if (input.segmentAlreadyLogged) return { status: 'already_logged' };

  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'breath_completed',
      payload: breathCompletedSegment2Payload(),
    });
    return afterSuccessfulLog(input.pauseInstanceId, deps);
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Segment 1 skip — always invokes when instance id present; marks segment logged on success. */
export async function runLogBreathSegment1Skipped(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; opts?: BreathCompletedSegment1Options },
  deps?: BreathSegmentLogDeps,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };

  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'breath_completed',
      payload: breathCompletedSegment1Payload({ skipped: true, ...input.opts }),
    });
    return afterSuccessfulLog(input.pauseInstanceId, deps);
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Segment 2 skip — always invokes when instance id present; marks segment logged on success. */
export async function runLogBreathSegment2Skipped(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null },
  deps?: BreathSegmentLogDeps,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };

  try {
    await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'breath_completed',
      payload: breathCompletedSegment2Payload({ skipped: true }),
    });
    return afterSuccessfulLog(input.pauseInstanceId, deps);
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Maps use-case result to hook boolean + ref update. */
export function applyBreathSegmentLogOutcome(
  outcome: RunBreathSegmentLogResult,
  segmentLoggedRef: { current: boolean },
): boolean {
  if (outcome.status === 'sync_failed') return false;
  if (outcome.status === 'success' && outcome.markSegmentLogged) {
    segmentLoggedRef.current = true;
  }
  return true;
}
