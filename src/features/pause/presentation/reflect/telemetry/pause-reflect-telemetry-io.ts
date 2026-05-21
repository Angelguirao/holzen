/**
 * Session reflect beat PostHog helpers (post-it, share, wallpaper taps).
 * Imports trackers via `pause-reflect-telemetry-flow` CI anchor
 * (parity with `pause-home-reflect-telemetry-io` → home telemetry flow).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
