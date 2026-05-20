import { trackEvent } from '@/lib/posthog';

export type PauseReflectTelemetrySurface = 'pause_reflect' | 'pause_done';

export function trackPauseReflectPostItOpen(pauseInstanceId: string | null): void {
  try {
    trackEvent('pause_reflect_post_it_open', {
      surface: 'pause_reflect',
      has_pause_id: !!pauseInstanceId,
    });
  } catch {
    /* no-op */
  }
}

export function trackPauseReflectShareTap(
  surface: PauseReflectTelemetrySurface,
  pauseInstanceId: string | null | undefined,
): void {
  try {
    trackEvent('pause_reflect_share_tap', {
      surface,
      has_pause_id: !!pauseInstanceId,
    });
  } catch {
    /* no-op */
  }
}

export function trackPauseReflectWallpaperTap(surface: PauseReflectTelemetrySurface): void {
  try {
    trackEvent('pause_reflect_wallpaper_tap', { surface });
  } catch {
    /* no-op */
  }
}
