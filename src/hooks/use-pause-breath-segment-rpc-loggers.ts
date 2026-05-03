import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import type { TFunction } from 'i18next';
import { pauseLogStep } from '@/lib/pause-api';
import { breathCompletedSegment1Payload, breathCompletedSegment2Payload } from '@/lib/pause-breath-completed-payload';
import { showPauseStepSyncFailedToast } from '@/lib/pause-step-sync-toast';

/**
 * Dedupes `breath_completed` RPCs for deep + brief breath segments and resets when `pauseInstanceId` changes.
 */
export function usePauseBreathSegmentRpcLoggers(input: {
  pauseInstanceId: string | null;
  /** When restoring past the first breath UI, segment 1 is already logged. */
  initialSegment1Logged: boolean;
  initialSegment2Logged: boolean;
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
  const { pauseInstanceId, initialSegment1Logged, initialSegment2Logged, t } = input;
  const breath1RpcDoneRef = useRef(initialSegment1Logged);
  const breath2RpcDoneRef = useRef(initialSegment2Logged);
  const prevPauseInstanceIdRef = useRef<string | null>(null);

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
      if (!pauseInstanceId) return true;
      if (breath1RpcDoneRef.current) return true;
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'breath_completed',
          payload: breathCompletedSegment1Payload({ briefRitual: !!briefRitual }),
        });
        breath1RpcDoneRef.current = true;
        return true;
      } catch {
        showPauseStepSyncFailedToast(t);
        return false;
      }
    },
    [pauseInstanceId, t],
  );

  const ensureBreathSegment2Logged = useCallback(async (): Promise<boolean> => {
    if (!pauseInstanceId) return true;
    if (breath2RpcDoneRef.current) return true;
    try {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'breath_completed',
        payload: breathCompletedSegment2Payload(),
      });
      breath2RpcDoneRef.current = true;
      return true;
    } catch {
      showPauseStepSyncFailedToast(t);
      return false;
    }
  }, [pauseInstanceId, t]);

  const logBreathSegment1Skipped = useCallback(
    async (opts?: { briefRitual?: boolean }): Promise<boolean> => {
      if (!pauseInstanceId) return true;
      try {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'breath_completed',
          payload: breathCompletedSegment1Payload({ skipped: true, ...opts }),
        });
        breath1RpcDoneRef.current = true;
        return true;
      } catch {
        showPauseStepSyncFailedToast(t);
        return false;
      }
    },
    [pauseInstanceId, t],
  );

  const logBreathSegment2Skipped = useCallback(async (): Promise<boolean> => {
    if (!pauseInstanceId) return true;
    try {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'breath_completed',
        payload: breathCompletedSegment2Payload({ skipped: true }),
      });
      breath2RpcDoneRef.current = true;
      return true;
    } catch {
      showPauseStepSyncFailedToast(t);
      return false;
    }
  }, [pauseInstanceId, t]);

  return {
    ensureBreathSegment1Logged,
    ensureBreathSegment2Logged,
    logBreathSegment1Skipped,
    logBreathSegment2Skipped,
    breath1RpcDoneRef,
    breath2RpcDoneRef,
  };
}
