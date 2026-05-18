import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import type { TFunction } from 'i18next';
import { invalidateCompanionUiCompletionQuery } from '@/lib/companion-ui-completion-query-key';
import { pauseLogStep } from '@/features/pause/public-rpc';
import { breathCompletedSegment1Payload, breathCompletedSegment2Payload } from '@/lib/pause-breath-completed-payload';
import type { PersistedSession } from '@/lib/pause-session-storage';
import { initialBreathSegmentRpcLoggedFlagsFromRestored } from '@/features/pause/application/session/step-map';
import { showPauseStepSyncFailedToast } from '@/features/pause/public';

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
        invalidateCompanionUiCompletionQuery(pauseInstanceId);
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
      invalidateCompanionUiCompletionQuery(pauseInstanceId);
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
        invalidateCompanionUiCompletionQuery(pauseInstanceId);
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
      invalidateCompanionUiCompletionQuery(pauseInstanceId);
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
