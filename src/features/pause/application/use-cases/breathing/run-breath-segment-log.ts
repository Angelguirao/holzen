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

type LogBreathCompletedPort = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) => Promise<void>;

export type BreathSegmentLogPorts = {
  logStep: LogBreathCompletedPort;
  invalidateCompanionCompletion?: (pauseInstanceId: string) => void;
};

function afterSuccessfulLog(
  pauseInstanceId: string,
  ports: BreathSegmentLogPorts,
): RunBreathSegmentLogResult {
  ports.invalidateCompanionCompletion?.(pauseInstanceId);
  return { status: 'success', markSegmentLogged: true };
}

/** First `breath_completed` RPC (deduped per segment ref). */
export async function runEnsureBreathSegment1Logged(
  input: {
    pauseInstanceId: string | null;
    segmentAlreadyLogged: boolean;
    briefRitual?: boolean;
  },
  ports: BreathSegmentLogPorts,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };
  if (input.segmentAlreadyLogged) return { status: 'already_logged' };

  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: breathCompletedSegment1Payload({ briefRitual: !!input.briefRitual }),
    });
    return afterSuccessfulLog(input.pauseInstanceId, ports);
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Second `breath_completed` RPC (deduped per segment ref). */
export async function runEnsureBreathSegment2Logged(
  input: { pauseInstanceId: string | null; segmentAlreadyLogged: boolean },
  ports: BreathSegmentLogPorts,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };
  if (input.segmentAlreadyLogged) return { status: 'already_logged' };

  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: breathCompletedSegment2Payload(),
    });
    return afterSuccessfulLog(input.pauseInstanceId, ports);
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Segment 1 skip — always invokes when instance id present; marks segment logged on success. */
export async function runLogBreathSegment1Skipped(
  input: { pauseInstanceId: string | null; opts?: BreathCompletedSegment1Options },
  ports: BreathSegmentLogPorts,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };

  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: breathCompletedSegment1Payload({ skipped: true, ...input.opts }),
    });
    return afterSuccessfulLog(input.pauseInstanceId, ports);
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Segment 2 skip — always invokes when instance id present; marks segment logged on success. */
export async function runLogBreathSegment2Skipped(
  input: { pauseInstanceId: string | null },
  ports: BreathSegmentLogPorts,
): Promise<RunBreathSegmentLogResult> {
  if (!input.pauseInstanceId) return { status: 'no_instance' };

  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: breathCompletedSegment2Payload({ skipped: true }),
    });
    return afterSuccessfulLog(input.pauseInstanceId, ports);
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
