/**
 * Session reflect beat PostHog helpers (post-it, share menu, wallpaper taps).
 * Colocated under `presentation/reflect/share/` beside share orchestration I/O (parity with application `share/pause-reflect-session-ui-telemetry`).
 * Imports trackers from `pause-reflect-session-ui-telemetry` directly (parity with
 * `pause-reflect-generation-io` leaf imports; not share umbrella or telemetry-flow anchor).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-session-ui-telemetry';
