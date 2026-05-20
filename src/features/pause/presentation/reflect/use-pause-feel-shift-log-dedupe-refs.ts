import { useEffect, useRef, type MutableRefObject } from 'react';

/**
 * Refs used to dedupe `initial_emotion_logged` / `shift_emotion_logged` `pauseLogStep` calls.
 * Cleared when `pauseInstanceId` changes so a new instance can log again.
 */
export function usePauseFeelShiftLogDedupeRefs(pauseInstanceId: string | null): {
  lastFeelLogKeyRef: MutableRefObject<string | null>;
  lastShiftLogKeyRef: MutableRefObject<string | null>;
} {
  const lastFeelLogKeyRef = useRef<string | null>(null);
  const lastShiftLogKeyRef = useRef<string | null>(null);

  useEffect(() => {
    lastFeelLogKeyRef.current = null;
    lastShiftLogKeyRef.current = null;
  }, [pauseInstanceId]);

  return { lastFeelLogKeyRef, lastShiftLogKeyRef };
}
