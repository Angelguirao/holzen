/**
 * Session reflect beat PostHog helpers (post-it, share menu, wallpaper taps).
 * Colocated under `presentation/reflect/telemetry/` (parity with application `ritual/reflect/telemetry/pause-reflect-session-ui-telemetry`).
 * Imports trackers from `pause-reflect-session-ui-telemetry` directly (parity with
 * `pause-reflect-generation-io` leaf imports; not share umbrella or telemetry-flow anchor).
 * Parity pins: `pause-reflect-telemetry-io.test.ts` (reciprocal pending-offer + generation-io sibling pins),
 * `pause-reflect-telemetry-io.re-exports.test.ts`,
 * `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io`, and
 * `pause-reflect-generation-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`, and
 * `pause-reflect-telemetry-pending-offer-telemetry-io-sibling-parity.test.ts` ↔ pending-offer telemetry-io,
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`, and
 * `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-ambience-io`, and
 * `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts` ↔ `pause-home-reflect-telemetry-io`,
 * `pause-reflect-steps-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io`, and
 * `pause-reflect-hub-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`, and
 * `pause-reflect-mood-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-mood-io`.
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
