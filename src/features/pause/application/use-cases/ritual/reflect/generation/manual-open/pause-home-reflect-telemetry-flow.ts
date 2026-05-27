/**
 * CI cluster anchor for Home reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in sibling `home-pause-actions-telemetry.ts` and `manual-pause-trigger-telemetry.ts`.
 * Presentation: `presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io.ts` imports leaf trackers directly. Parity pins in `pause-home-reflect-telemetry-io.re-exports.test.ts`, colocated `pause-home-reflect-telemetry-io-parity.test.ts` (leaf + home-reflect-io distinctness), application mirror `telemetry/pause-home-reflect-telemetry-io-parity.test.ts`, `telemetry/pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts` (↔ `pause-reflect-telemetry-flow`), `telemetry/pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`, and `telemetry/pause-home-reflect-telemetry-flow-manual-open-flow-sibling-parity.test.ts` (↔ `pause-reflect-generation-manual-open-flow`).
 */
export {
  trackPauseOpenDismissed,
  type PauseDismissAnalyticsSurface,
} from './home-pause-actions-telemetry';
export {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
} from './manual-pause-trigger-telemetry';
