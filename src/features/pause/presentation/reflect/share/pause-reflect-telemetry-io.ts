/**
 * Session reflect beat PostHog helpers (post-it, share menu, wallpaper taps).
 * Colocated under `presentation/reflect/share/` beside share orchestration I/O (parity with application `share/pause-reflect-session-ui-telemetry`).
 * Imports trackers via `pause-reflect-telemetry-flow` CI anchor
 * (parity with `pause-home-reflect-telemetry-io` → `pause-home-reflect-telemetry-flow`).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-telemetry-flow';
