import { useEffect, useRef } from 'react';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';
import { resolvePauseArrivalToneAction } from '@/features/pause/application/use-cases/home/resolve-pause-arrival-tone-action';

function readHolzenSoundEnabled(): boolean {
  try {
    return localStorage.getItem('holzen_sound_enabled') !== 'false';
  } catch {
    return true;
  }
}

/** Prefetch tone once; play once per distinct open pause when `newPauseArrival` fires. */
export function usePauseArrivalAudio(
  newPauseArrival: boolean,
  pauseInstanceId: string | null,
  clearNewPauseArrival: () => void,
): void {
  const lastToneInstanceRef = useRef<string | null>(null);

  useEffect(() => {
    prefetchNotificationTone();
  }, []);

  useEffect(() => {
    const action = resolvePauseArrivalToneAction(
      newPauseArrival,
      pauseInstanceId,
      lastToneInstanceRef.current,
    );
    if (action === 'none') return;
    if (action === 'clear-only') {
      clearNewPauseArrival();
      return;
    }
    lastToneInstanceRef.current = pauseInstanceId;
    if (readHolzenSoundEnabled()) {
      void playNotificationTone();
    }
    clearNewPauseArrival();
  }, [newPauseArrival, pauseInstanceId, clearNewPauseArrival]);
}
