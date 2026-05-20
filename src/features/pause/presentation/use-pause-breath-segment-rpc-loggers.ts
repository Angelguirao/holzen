import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import type { TFunction } from 'i18next';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/feedback/step-sync-toast';
import {
  applyBreathSegmentLogOutcome,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  type PersistedSession,
} from '@/features/pause/public';
import { pauseBreathSegmentLogPorts } from '@/features/pause/public-rpc';

/**
 * Dedupes `breath_completed` RPCs for deep + brief breath segments and resets when `pauseInstanceId` changes.
 *
 * **`restored`:** read on **first mount only** (via `useRef` seeds) through
 * {@link initialBreathSegmentRpcLoggedFlagsFromRestored} — same contract as when the page passed explicit booleans.
 */
export function usePauseBreathSegmentRpcLoggers(input: {
  pauseInstanceId: string | null;
  restored: PersistedSession | null;
  t: TFunction;
}): {
  ensureBreathSegment1Logged: (briefRitual?: boolean) => Promise<boolean>;
  ensureBreathSegment2Logged: () => Promise<boolean>;
  /** `breath_completed` segment 1 with `skipped: true` (deep or brief). */
  logBreathSegment1Skipped: (opts?: { briefRitual?: boolean }) => Promise<boolean>;
  logBreathSegment2Skipped: () => Promise<boolean>;
  breath1RpcDoneRef: MutableRefObject<boolean>;
  breath2RpcDoneRef: MutableRefObject<boolean>;
} {
  const { pauseInstanceId, restored, t } = input;
  const { segment1Logged, segment2Logged } = initialBreathSegmentRpcLoggedFlagsFromRestored(restored);
  const breath1RpcDoneRef = useRef(segment1Logged);
  const breath2RpcDoneRef = useRef(segment2Logged);
  const prevPauseInstanceIdRef = useRef<string | null>(null);

  const breathPorts = pauseBreathSegmentLogPorts;

  const handleBreathOutcome = useCallback(
    (outcome: Parameters<typeof applyBreathSegmentLogOutcome>[0], ref: MutableRefObject<boolean>) => {
      if (outcome.status === 'sync_failed') {
        showPauseStepSyncFailedToast(t);
        return false;
      }
      return applyBreathSegmentLogOutcome(outcome, ref);
    },
    [t],
  );

  useEffect(() => {
    const prev = prevPauseInstanceIdRef.current;
    if (prev !== null && prev !== pauseInstanceId) {
      breath1RpcDoneRef.current = false;
      breath2RpcDoneRef.current = false;
    }
    prevPauseInstanceIdRef.current = pauseInstanceId;
  }, [pauseInstanceId]);

  const ensureBreathSegment1Logged = useCallback(
    async (briefRitual?: boolean): Promise<boolean> => {
      const outcome = await runEnsureBreathSegment1Logged(
        {
          pauseInstanceId,
          segmentAlreadyLogged: breath1RpcDoneRef.current,
          briefRitual,
        },
        breathPorts,
      );
      return handleBreathOutcome(outcome, breath1RpcDoneRef);
    },
    [pauseInstanceId, breathPorts, handleBreathOutcome],
  );

  const ensureBreathSegment2Logged = useCallback(async (): Promise<boolean> => {
    const outcome = await runEnsureBreathSegment2Logged(
      { pauseInstanceId, segmentAlreadyLogged: breath2RpcDoneRef.current },
      breathPorts,
    );
    return handleBreathOutcome(outcome, breath2RpcDoneRef);
  }, [pauseInstanceId, breathPorts, handleBreathOutcome]);

  const logBreathSegment1SkippedHandler = useCallback(
    async (opts?: { briefRitual?: boolean }): Promise<boolean> => {
      const outcome = await runLogBreathSegment1Skipped(
        { pauseInstanceId, opts },
        breathPorts,
      );
      return handleBreathOutcome(outcome, breath1RpcDoneRef);
    },
    [pauseInstanceId, breathPorts, handleBreathOutcome],
  );

  const logBreathSegment2SkippedHandler = useCallback(async (): Promise<boolean> => {
    const outcome = await runLogBreathSegment2Skipped({ pauseInstanceId }, breathPorts);
    return handleBreathOutcome(outcome, breath2RpcDoneRef);
  }, [pauseInstanceId, breathPorts, handleBreathOutcome]);

  return {
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped: logBreathSegment1SkippedHandler,
    logBreathSegment2Skipped: logBreathSegment2SkippedHandler,
    breath1RpcDoneRef,
    breath2RpcDoneRef,
  };
}
