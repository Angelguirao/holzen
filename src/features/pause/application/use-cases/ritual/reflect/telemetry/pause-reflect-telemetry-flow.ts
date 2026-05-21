/**
 * CI cluster anchor for session reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in `pause-reflect-session-ui-telemetry.ts`.
 * Presentation: `pause-reflect-telemetry-io.ts` imports trackers directly (off this CI anchor).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-session-ui-telemetry';
