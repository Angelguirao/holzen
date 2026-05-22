/**
 * CI cluster anchor for archive retrospective decide presentation I/O (§3 / check:architecture-alignment).
 * Re-exports retrospective outcome log + PostHog helpers for application-layer imports.
 * Presentation: `pause-archive-io.ts` imports through this anchor (off deep ritual/decide paths).
 */
export { logRetrospectiveOutcome } from './log-retrospective-outcome';
export {
  trackPauseOutcomeRetrospective,
  type PauseOutcomeRetrospectiveSurface,
} from './pause-outcome-retrospective-telemetry';
