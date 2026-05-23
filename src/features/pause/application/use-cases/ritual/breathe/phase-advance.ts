/**
 * CI cluster anchor for ritual breathe phase advance (§3 / check:architecture-alignment).
 * Pure timed-loop advance helpers live in domain; re-export for application-layer imports.
 */
export {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceResult,
  type BreathingTimedLoopState,
} from '@/features/pause/domain/ritual/breathe/phase-advance';

export { BOX_BREATH_PHASE_COUNT } from './breathing-constants';
