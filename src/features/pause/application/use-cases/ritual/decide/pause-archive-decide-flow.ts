/**
 * CI cluster anchor for archive retrospective decide presentation I/O (§3 / check:architecture-alignment).
 * Cluster marker: `ritual-decide-cluster.ts` (empty export; unit-tested).
 * Composes RPC + PostHog subcluster anchors.
 * Presentation: `pause-archive-io.ts` imports RPC + telemetry leaf modules directly (off this anchor);
 * `pause-archive-io.re-exports.test.ts` and `presentation/archive/pause-archive-io-parity.test.ts`
 * may import this anchor for parity only (CI exempt).
 * Application mirror: `pause-archive-io-parity.test.ts` beside this flow anchor.
 */
export { logRetrospectiveOutcome } from './pause-archive-decide-rpc-flow';
export {
  trackPauseOutcomeRetrospective,
  type PauseOutcomeRetrospectiveSurface,
} from './pause-archive-decide-telemetry-flow';
