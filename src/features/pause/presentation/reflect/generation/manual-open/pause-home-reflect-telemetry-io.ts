/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/reflect/generation/manual-open/` beside
 * `pause-home-reflect-io` and `apply-manual-pause-open-result` (parity with
 * application `generation/manual-open/` + `telemetry/home/` + `telemetry/manual-open/`).
 * Imports trackers via `pause-home-reflect-telemetry-flow` CI anchor
 * (parity with `pause-reflect-telemetry-io` → session telemetry flow).
 */
export {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-home-reflect-telemetry-flow';
