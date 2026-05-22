/**
 * CI cluster anchor for Home reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in sibling `home-pause-actions-telemetry.ts` and `manual-pause-trigger-telemetry.ts`.
 * Presentation: `presentation/reflect/telemetry/pause-home-reflect-telemetry-io.ts` imports leaf trackers directly (CI cluster anchor only; generation umbrella must not compose PostHog per check:architecture-alignment).
 */
export {
  trackHomePendingPauseBannerPauseOpened,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from './home-pause-actions-telemetry';
export {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
} from './manual-pause-trigger-telemetry';
