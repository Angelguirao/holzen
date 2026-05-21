/**
 * CI cluster anchor for ritual reflect telemetry (§3 / check:architecture-alignment).
 * PostHog trackers: `pause-reflect-session-ui-telemetry.ts`.
 * Presentation: `presentation/reflect/telemetry/pause-reflect-telemetry-io.ts`.
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-session-ui-telemetry';
