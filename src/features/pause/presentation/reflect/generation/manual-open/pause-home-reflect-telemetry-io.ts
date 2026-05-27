/**
 * Home manual-open PostHog helpers (manual open + dismiss/banner).
 * Colocated under `presentation/reflect/generation/manual-open/` beside `pause-home-reflect-io`;
 * application trackers stay in `ritual/reflect/generation/manual-open/`.
 * Imports trackers from leaf modules directly (not generation umbrella or telemetry-flow anchor).
 * External consumers import `presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io` (telemetry cluster is session UI only).
 * Parity pins: colocated `pause-home-reflect-telemetry-io-parity.test.ts` (leaf + home-reflect-io distinctness);
 * application mirror `application/.../manual-open/pause-home-reflect-telemetry-io-parity.test.ts`.
 * Sibling parity: `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts` ↔ session `pause-reflect-telemetry-io`;
 * `pause-home-reflect-telemetry-home-reflect-io-sibling-parity.test.ts` ↔ `pause-home-reflect-io`.
 */
export {
  trackPauseOpenDismissed,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry';
export {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry';
