/**
 * Session reflect beat PostHog helpers (post-it, share, wallpaper taps).
 * Imports trackers directly from `pause-reflect-session-ui-telemetry` (off
 * `pause-reflect-telemetry-flow` CI anchor; parity with mood/hub I/O peels).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/session/pause-reflect-session-ui-telemetry';
