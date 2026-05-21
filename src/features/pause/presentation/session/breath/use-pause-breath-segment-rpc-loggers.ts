import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import type { TFunction } from 'i18next';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import { applyBreathSegmentLogOutcome } from '@/features/pause/domain/ritual/breathe/apply-breath-segment-log-outcome';
import { initialBreathSegmentRpcLoggedFlagsFromRestored } from '@/features/pause/domain/ritual/breathe/initial-breath-segment-rpc-flags';
import {
  pauseEnsureBreathSegment1Logged,
  pauseEnsureBreathSegment2Logged,
  pauseLogBreathSegment1Skipped,
  pauseLogBreathSegment2Skipped,
} from '@/features/pause/presentation/session/breath/pause-session-breath-io';
import { showPauseStepSyncFailedToast } from '@/features/pause/presentation/ritual/pause-step-sync-toast';

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

  const ensureBreathSegment1LoggedHandler = useCallback(
    async (briefRitual?: boolean): Promise<boolean> => {
      const outcome = await pauseEnsureBreathSegment1Logged({
        pauseInstanceId,
        segmentAlreadyLogged: breath1RpcDoneRef.current,
        briefRitual,
      });
      return handleBreathOutcome(outcome, breath1RpcDoneRef);
    },
    [pauseInstanceId, handleBreathOutcome],
  );

  const ensureBreathSegment2LoggedHandler = useCallback(async (): Promise<boolean> => {
    const outcome = await pauseEnsureBreathSegment2Logged({
      pauseInstanceId,
      segmentAlreadyLogged: breath2RpcDoneRef.current,
    });
    return handleBreathOutcome(outcome, breath2RpcDoneRef);
  }, [pauseInstanceId, handleBreathOutcome]);

  const logBreathSegment1SkippedHandler = useCallback(
    async (opts?: { briefRitual?: boolean }): Promise<boolean> => {
      const outcome = await pauseLogBreathSegment1Skipped({ pauseInstanceId, opts });
      return handleBreathOutcome(outcome, breath1RpcDoneRef);
    },
    [pauseInstanceId, handleBreathOutcome],
  );

  const logBreathSegment2SkippedHandler = useCallback(async (): Promise<boolean> => {
    const outcome = await pauseLogBreathSegment2Skipped({ pauseInstanceId });
    return handleBreathOutcome(outcome, breath2RpcDoneRef);
  }, [pauseInstanceId, handleBreathOutcome]);

  return {
    ensureBreathSegment1Logged: ensureBreathSegment1LoggedHandler,
    ensureBreathSegment2Logged: ensureBreathSegment2LoggedHandler,
    logBreathSegment1Skipped: logBreathSegment1SkippedHandler,
    logBreathSegment2Skipped: logBreathSegment2SkippedHandler,
    breath1RpcDoneRef,
    breath2RpcDoneRef,
  };
}
