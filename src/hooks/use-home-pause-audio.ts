import { useEffect, useRef } from 'react';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';

function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem('holzen_sound_enabled') !== 'false';
  } catch {
    return true;
  }
}

/** Prefetch tone once; play once per distinct open pause when `newPauseArrival` fires. */
export function useHomePauseAudio(
  newPauseArrival: boolean,
  pauseInstanceId: string | null,
  clearNewPauseArrival: () => void,
): void {
  const lastToneInstanceRef = useRef<string | null>(null);

  useEffect(() => {
    prefetchNotificationTone();
  }, []);

  useEffect(() => {
    if (!newPauseArrival || !pauseInstanceId) return;
    if (pauseInstanceId === lastToneInstanceRef.current) {
      clearNewPauseArrival();
      return;
    }
    lastToneInstanceRef.current = pauseInstanceId;
    if (readSoundEnabled()) {
      playNotificationTone();
    }
    clearNewPauseArrival();
  }, [newPauseArrival, pauseInstanceId, clearNewPauseArrival]);
}
