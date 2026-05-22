/**
 * CI cluster anchor for Home reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in sibling `home-pause-actions-telemetry.ts` and `manual-pause-trigger-telemetry.ts`.
 * Presentation: `presentation/reflect/telemetry/pause-home-reflect-telemetry-io.ts` imports leaf trackers directly (CI cluster anchor only; generation umbrella must not compose PostHog per check:architecture-alignment). Parity pins in `pause-home-reflect-telemetry-io.re-exports.test.ts`, `presentation/reflect/telemetry/pause-home-reflect-telemetry-io-parity.test.ts`, `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts` (↔ `pause-reflect-telemetry-flow`; presentation via `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`), and `pause-home-reflect-telemetry-flow-manual-open-flow-sibling-parity.test.ts` (↔ `pause-reflect-generation-manual-open-flow`).
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
