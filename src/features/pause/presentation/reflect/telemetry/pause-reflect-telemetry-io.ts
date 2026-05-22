/**
 * Session reflect beat PostHog helpers (post-it, share menu, wallpaper taps).
 * Colocated under `presentation/reflect/telemetry/` (parity with application `ritual/reflect/telemetry/pause-reflect-session-ui-telemetry`).
 * Imports trackers from `pause-reflect-session-ui-telemetry` directly (parity with
 * `pause-reflect-generation-io` leaf imports; not share umbrella or telemetry-flow anchor).
 * Parity pins: `pause-reflect-telemetry-io.test.ts` (reciprocal pending-offer sibling pins),
 * `pause-reflect-telemetry-io.re-exports.test.ts`,
 * `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io`, and
 * `pause-reflect-generation-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`, and
<<<<<<< HEAD
 * `pause-reflect-telemetry-pending-offer-telemetry-io-sibling-parity.test.ts` ↔ pending-offer telemetry-io,
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`, and
 * `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts` ↔ `pause-home-reflect-telemetry-io`.
=======
 * `pause-reflect-telemetry-pending-offer-telemetry-io-sibling-parity.test.ts` ↔ pending-offer telemetry-io, and
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`.
>>>>>>> c0948c231 (test(pause): add share-io ↔ telemetry-io presentation sibling parity)
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
