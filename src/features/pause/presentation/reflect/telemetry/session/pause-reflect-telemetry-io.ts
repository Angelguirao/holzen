/**
 * Session reflect beat PostHog helpers (post-it, share, wallpaper taps).
 * Colocated under `presentation/reflect/telemetry/session/` (parity with application `share/pause-reflect-session-ui-telemetry`).
 * Imports trackers via `pause-reflect-telemetry-flow` CI anchor.
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
