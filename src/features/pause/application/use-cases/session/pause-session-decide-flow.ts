/**
 * CI cluster anchor for session decide ritual hydration (§3 / check:architecture-alignment).
 * Cluster marker: `pause-session-decide-cluster.ts` (empty export; unit-tested).
 * Use cases live in `ritual/decide/`; presentation decide I/O imports leaf modules (CI anchor only).
 */
export {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '../ritual/decide/restored-decide-ritual-state';
export type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
