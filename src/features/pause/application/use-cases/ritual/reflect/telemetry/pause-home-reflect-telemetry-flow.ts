/**
 * CI cluster anchor for Home reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in `home-pause-actions-telemetry.ts` and `manual-pause-trigger-telemetry.ts`.
 * Presentation: `pause-home-reflect-telemetry-io.ts` imports trackers directly (off this CI anchor).
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
