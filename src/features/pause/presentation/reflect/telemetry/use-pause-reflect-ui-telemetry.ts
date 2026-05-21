import { useCallback } from 'react';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-ui-telemetry';

/** PostHog callbacks for Reflect step and Done share row — keep `trackEvent` out of `.tsx`. */
export function usePauseReflectUiTelemetry(
  pauseInstanceId: string | null | undefined,
  surface: PauseReflectTelemetrySurface,
) {
  const onPostItOpen = useCallback(() => {
    if (surface === 'pause_reflect') {
      trackPauseReflectPostItOpen(pauseInstanceId ?? null);
    }
  }, [pauseInstanceId, surface]);

  const onShareMenuOpen = useCallback(() => {
    trackPauseReflectShareTap(surface, pauseInstanceId);
  }, [surface, pauseInstanceId]);

  const onWallpaperTap = useCallback(() => {
    trackPauseReflectWallpaperTap(surface);
  }, [surface]);

  return { onPostItOpen, onShareMenuOpen, onWallpaperTap };
}
