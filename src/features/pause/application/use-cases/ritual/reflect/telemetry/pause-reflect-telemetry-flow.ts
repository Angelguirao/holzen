/**
 * CI cluster anchor for session reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in `pause-reflect-session-ui-telemetry.ts`.
 * Presentation: `pause-reflect-telemetry-io.ts` imports session-ui telemetry directly.
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-session-ui-telemetry';
