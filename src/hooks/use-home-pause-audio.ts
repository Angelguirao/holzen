import { useEffect, useRef } from 'react';
import { playNotificationTone, prefetchNotificationTone } from '@/lib/notification-tone';

function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem('holzen_sound_enabled') !== 'false';
  } catch {
    return true;
  }
}

/** Prefetch tone once; play once per distinct `message` when `newPauseArrival` fires. */
export function useHomePauseAudio(
  newPauseArrival: boolean,
  message: string | null,
  clearNewPauseArrival: () => void,
): void {
  const lastToneMsgRef = useRef<string | null>(null);

  useEffect(() => {
    prefetchNotificationTone();
  }, []);

  useEffect(() => {
    if (!newPauseArrival || !message) return;
    if (message === lastToneMsgRef.current) {
      clearNewPauseArrival();
      return;
    }
    lastToneMsgRef.current = message;
    if (readSoundEnabled()) {
      playNotificationTone();
    }
    clearNewPauseArrival();
  }, [newPauseArrival, message, clearNewPauseArrival]);
}
