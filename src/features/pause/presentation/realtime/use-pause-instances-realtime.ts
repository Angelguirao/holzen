import { useCallback, useEffect, useRef } from 'react';
import { subscribePauseInstancesForUser } from '@/features/pause/public-queries';

/** Coalesce burst `pause_instances` events (cron + artifact writes) into one resync. */
const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Invalidate or resync when `pause_instances` changes (cron offers, complete, dismiss).
 * `channelName` must be unique per subscriber to avoid Supabase channel collisions.
 */
export function usePauseInstancesRealtime(
  userId: string | undefined,
  channelName: string,
  onInstancesChange: () => void,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
) {
  const onChangeRef = useRef(onInstancesChange);
  onChangeRef.current = onInstancesChange;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stableHandler = useCallback(() => {
    if (debounceMs <= 0) {
      onChangeRef.current();
      return;
    }
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      onChangeRef.current();
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    if (!userId) return;
    return subscribePauseInstancesForUser(userId, channelName, stableHandler);
  }, [userId, channelName, stableHandler]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    },
    [],
  );
}
