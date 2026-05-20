import { useEffect, useRef } from 'react';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/breathing/ritual-audio';

/**
 * Soft continuous low-frequency bed while Reflect or Frame is visible and ritual sound is on.
 * Uses the same `AudioContext` singleton as breathing cues; stops on step change / mute / PRM.
 */
export function usePauseReflectFrameFocusAmbience(opts: {
  active: boolean;
  muted: boolean;
  prefersReducedMotion: boolean;
}): void {
  const { active, muted, prefersReducedMotion } = opts;
  const gateRef = useRef({ active, muted, prefersReducedMotion });
  gateRef.current = { active, muted, prefersReducedMotion };

  useEffect(() => {
    if (!active) {
      stopPauseReflectFrameFocusAmbience();
      return;
    }
    startPauseReflectFrameFocusAmbience(() => {
      const g = gateRef.current;
      return g.active && !g.muted && !g.prefersReducedMotion;
    });
    return () => {
      stopPauseReflectFrameFocusAmbience();
    };
  }, [active, muted, prefersReducedMotion]);
}
