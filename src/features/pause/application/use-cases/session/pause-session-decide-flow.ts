/**
 * CI cluster anchor for session decide ritual hydration (§3 / check:architecture-alignment).
 * Use cases live in `ritual/decide/`; re-export for application imports.
 * Presentation: `pause-session-decide-io.ts` imports `PauseImpactData` from domain directly (CI anchor only).
 */
export {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '../ritual/decide/restored-decide-ritual-state';
export type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
