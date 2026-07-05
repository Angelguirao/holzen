/**
 * Featured intervention (mirror / trap / pattern / question headline) — not imported from active `src/`.
 * Re-enable via `PAUSE_FEATURED_INTERVENTION_ENABLED` and restoring UI; see README.md.
 */
export { PAUSE_FEATURED_INTERVENTION_ENABLED } from './domain/pause-featured-intervention';
export type {
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
} from './domain/intervention-types';
export { buildInterventionOrchestrateBody } from './application/build-intervention-orchestrate-body';
export { runCompanionInterventionBootstrap } from './application/run-companion-intervention-bootstrap';
export { resetInterventionIdempotency } from './application/intervention-idempotency';
export { useCompanionInterventionBootstrap } from './presentation/use-companion-intervention-bootstrap';
export { useCompanionInterventionFetch } from './presentation/use-companion-intervention-fetch';
export { InterventionCrossRefBadge } from './components/InterventionCrossRefBadge';
