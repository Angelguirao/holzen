/**
 * CI cluster anchor for archive retrospective decide presentation I/O (§3 / check:architecture-alignment).
 * Cluster marker: `ritual-decide-cluster.ts` (empty export; unit-tested).
 * Composes RPC + PostHog subcluster anchors.
 * Presentation: `pause-archive-io.ts` imports RPC + telemetry leaf modules directly (off this anchor).
 */
export { logRetrospectiveOutcome } from './pause-archive-decide-rpc-flow';
export {
  trackPauseOutcomeRetrospective,
  type PauseOutcomeRetrospectiveSurface,
} from './pause-archive-decide-telemetry-flow';
