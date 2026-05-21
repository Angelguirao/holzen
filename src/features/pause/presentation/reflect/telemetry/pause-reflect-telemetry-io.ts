/**
 * Session reflect beat PostHog helpers (post-it, share, wallpaper taps).
 * Imports trackers directly (off `pause-reflect-telemetry-flow` CI anchor; parity with steps/hub I/O peels).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
