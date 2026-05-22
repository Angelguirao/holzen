/**
 * CI cluster anchor for session reflect PostHog telemetry (§3 / check:architecture-alignment).
 * Trackers live in sibling `pause-reflect-session-ui-telemetry.ts` (post-it / share / wallpaper taps).
 * Presentation: `presentation/reflect/telemetry/pause-reflect-telemetry-io.ts` imports `pause-reflect-session-ui-telemetry` directly (not this anchor); `pause-reflect-share-flow` composes trackers from `telemetry/pause-reflect-session-ui-telemetry` directly (not this subcluster).
 * Parity pins: `pause-reflect-telemetry-io.re-exports.test.ts`, `pause-reflect-telemetry-io-parity.test.ts` (application I/O ↔ umbrella + leaf + presentation sibling), `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts` (presentation I/O ↔ umbrella + leaf + share-flow sibling), `pause-reflect-telemetry-flow.test.ts` (sibling cluster ↔ `pause-pending-offer-telemetry-flow`, ↔ `pause-reflect-share-flow`, ↔ `pause-reflect-flows-flow` inline, ↔ `pause-reflect-steps-flow` inline, ↔ `pause-reflect-generation-flow` inline), `pending-offer/pause-reflect-telemetry-pending-offer-flow-sibling-parity.test.ts` (↔ `pause-pending-offer-telemetry-flow`), `pause-reflect-share-telemetry-flow-sibling-parity.test.ts` (↔ `pause-reflect-share-flow`), `pause-reflect-flows-telemetry-flow-sibling-parity.test.ts` (↔ `pause-reflect-flows-flow`), `pause-reflect-steps-telemetry-flow-sibling-parity.test.ts` (↔ `pause-reflect-steps-flow`), `pause-reflect-generation-telemetry-flow-sibling-parity.test.ts` (↔ `pause-reflect-generation-flow`), `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts` (↔ `pause-home-reflect-telemetry-flow`; presentation via `presentation/reflect/generation/manual-open/pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`).
 */
export {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from './pause-reflect-session-ui-telemetry';
