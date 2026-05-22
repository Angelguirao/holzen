/**
 * CI cluster anchor for session reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in sibling `pause-reflect-session-ui-telemetry.ts` (post-it / share / wallpaper taps).
 * Presentation: `presentation/reflect/telemetry/pause-reflect-telemetry-io.ts` imports `pause-reflect-session-ui-telemetry` directly (not this anchor); `pause-reflect-share-flow` composes trackers from `telemetry/pause-reflect-session-ui-telemetry` directly (not this subcluster).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-session-ui-telemetry';
