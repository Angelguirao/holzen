/**
 * Session reflect beat PostHog helpers (post-it, share menu, wallpaper taps).
 * Colocated under `presentation/reflect/telemetry/` (parity with application `ritual/reflect/telemetry/pause-reflect-session-ui-telemetry`).
 * Imports trackers from `pause-reflect-session-ui-telemetry` directly (parity with
 * `pause-reflect-generation-io` leaf imports; not share umbrella or telemetry-flow anchor).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
