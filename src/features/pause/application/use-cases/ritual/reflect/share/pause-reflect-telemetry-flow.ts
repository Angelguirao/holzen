/**
 * CI cluster anchor for session reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in sibling `pause-reflect-session-ui-telemetry.ts` (post-it / share / wallpaper taps).
 * Presentation: `pause-reflect-telemetry-io.ts` imports `pause-reflect-session-ui-telemetry` directly (CI cluster anchor only); `pause-reflect-share-flow` composes trackers directly (not this subcluster).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-session-ui-telemetry';
