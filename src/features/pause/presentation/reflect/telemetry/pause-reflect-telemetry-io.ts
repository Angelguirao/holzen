/**
 * Session reflect beat PostHog helpers (post-it, share menu, wallpaper taps).
 * Colocated under `presentation/reflect/telemetry/` (parity with application `ritual/reflect/telemetry/pause-reflect-session-ui-telemetry`).
 * Imports trackers from `pause-reflect-session-ui-telemetry` directly (parity with
 * `pause-reflect-generation-io` leaf imports; not share umbrella or telemetry-flow anchor).
 * Parity pins: `pause-reflect-telemetry-io.test.ts` (reciprocal pending-offer + generation-io sibling pins), colocated `pause-reflect-telemetry-io-parity.test.ts` (presentation I/O ↔ telemetry-flow umbrella + leaf + share-flow + flow-cluster siblings),
 * `pause-reflect-telemetry-io.re-exports.test.ts` ↔ `pause-reflect-generation-io.re-exports.test.ts` (reciprocal inline pins),
 * `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io` (application
 * `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` under `application/.../flows/`; reciprocal inline pins in
 * `pause-reflect-flows-io-parity.test.ts` ↔ `pause-reflect-telemetry-io-parity.test.ts`), and
 * `pause-reflect-generation-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io` (presentation + application), and
 * `presentation/reflect/pending-offer/pause-reflect-telemetry-pending-offer-telemetry-io-sibling-parity.test.ts` ↔ pending-offer telemetry-io,
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io` (application mirror:
 * `application/.../share/pause-reflect-share-telemetry-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-reflect-telemetry-io-parity.test.ts` (colocated) ↔ `pause-reflect-share-io-parity.test.ts` and
 * `pause-reflect-ambience-io-parity.test.ts`), and
 * `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-ambience-io` (application mirror:
 * `application/.../ambience/pause-reflect-ambience-telemetry-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-reflect-telemetry-io-parity.test.ts` ↔ `pause-reflect-ambience-io-parity.test.ts`), and
 * `presentation/reflect/telemetry/pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts` ↔ `pause-home-reflect-telemetry-io`,
 * `pause-reflect-steps-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io` (presentation + application;
 * reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts` ↔ `pause-reflect-telemetry-io-parity.test.ts`), and
 * `pause-reflect-hub-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io` (application mirror:
 * `application/.../hub/pause-reflect-hub-telemetry-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-reflect-hub-io-parity.test.ts` ↔ `pause-reflect-telemetry-io-parity.test.ts` presentation colocated), and
 * `pause-feel-telemetry-io-sibling-parity.test.ts` ↔ `pause-feel-io`.
 * Flow↔I/O wrapper: `pause-reflect-telemetry-flow-io-wrapper-sibling-parity.test.ts` (application + presentation).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
