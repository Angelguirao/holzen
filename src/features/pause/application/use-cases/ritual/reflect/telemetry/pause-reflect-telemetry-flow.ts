/**
 * CI cluster anchor for session reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in `share/pause-reflect-session-ui-telemetry.ts` (post-it / share / wallpaper taps).
 * Presentation: `presentation/reflect/share/pause-reflect-telemetry-io.ts` imports through this anchor (off deep share paths).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '../share/pause-reflect-session-ui-telemetry';
