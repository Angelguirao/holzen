/**
 * CI cluster anchor for session decide ritual hydration (§3 / check:architecture-alignment).
 * Use cases live in `ritual/decide/`; re-export for presentation I/O imports.
 */
export {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '../ritual/decide/restored-decide-ritual-state';
export type { PauseImpactData } from '../ritual/reflect/flows/pause-decide-outcome-view-flow';
