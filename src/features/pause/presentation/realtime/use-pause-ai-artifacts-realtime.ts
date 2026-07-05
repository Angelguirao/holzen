import { useCallback, useEffect, useRef } from 'react';
import { subscribePauseAiArtifactsForInstance } from '@/features/pause/public-queries';

const DEFAULT_DEBOUNCE_MS = 300;

/** Invalidate companion snapshot when artifacts land (replaces 2s polling on full-view routes). */
export function usePauseAiArtifactsRealtime(
  pauseInstanceId: string | undefined,
  channelName: string,
  onArtifactsChange: () => void,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
) {
  const onChangeRef = useRef(onArtifactsChange);
  onChangeRef.current = onArtifactsChange;

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
    if (!pauseInstanceId) return;
    return subscribePauseAiArtifactsForInstance(pauseInstanceId, channelName, stableHandler);
  }, [pauseInstanceId, channelName, stableHandler]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    },
    [],
  );
}
