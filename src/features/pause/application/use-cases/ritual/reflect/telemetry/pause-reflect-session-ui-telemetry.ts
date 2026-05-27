import { trackEvent } from './pause-reflect-product-telemetry';

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

export function trackPauseReflectBlockViewed(
  pauseInstanceId: string | null,
  props: { has_draft?: boolean; schema_version?: number },
): void {
  try {
    trackEvent('pause_reflect_block_viewed', {
      has_pause_id: !!pauseInstanceId,
      has_draft: props.has_draft ?? false,
      schema_version: props.schema_version ?? 2,
    });
  } catch {
    /* no-op */
  }
}

export function trackPauseReflectContextStripExpanded(
  pauseInstanceId: string | null,
  context: string | null | undefined,
): void {
  try {
    const lower = (context ?? '').toLowerCase();
    let direction = 'flat';
    if (lower.includes('is down')) direction = 'down';
    else if (lower.includes('is up')) direction = 'up';
    trackEvent('pause_reflect_context_strip_expanded', {
      has_pause_id: !!pauseInstanceId,
      direction,
    });
  } catch {
    /* no-op */
  }
}

export function trackPauseReflectInquiryDisplayed(
  pauseInstanceId: string | null,
  props: { mood?: string },
): void {
  try {
    trackEvent('pause_reflect_inquiry_displayed', {
      has_pause_id: !!pauseInstanceId,
      mood: props.mood,
    });
  } catch {
    /* no-op */
  }
}
