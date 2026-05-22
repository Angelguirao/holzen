/**
 * CI cluster anchor for archive retrospective decide presentation I/O (§3 / check:architecture-alignment).
 * Composes RPC + PostHog subcluster anchors.
 * Presentation: `pause-archive-io.ts` imports through this anchor (off deep ritual/decide paths).
 */
export { logRetrospectiveOutcome } from './pause-archive-decide-rpc-flow';
export {
  trackPauseOutcomeRetrospective,
  type PauseOutcomeRetrospectiveSurface,
} from './pause-archive-decide-telemetry-flow';
