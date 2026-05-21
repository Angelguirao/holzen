/**
 * Pause session shell pure helpers (no Supabase).
 * Presentation hooks import from here instead of deep `application/use-cases/session/*`.
 */
export { pauseStepLayout } from './presentation/session/pause-step-layout';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './domain/session/persisted-session-guards';
export { isPauseSessionDepthPickerActive } from './domain/reflect/mood/pause-depth-picker-active';
export { isPauseSessionWaitingForInstanceFetch } from './domain/session/waiting-for-instance-fetch';
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from './application/use-cases/ritual/breathe/breath-second-label-variant';
export type { PauseBreathingPhase } from './application/use-cases/ritual/breathe/pause-breathing-phase';
export {
  computeBreathingPhaseAdvance,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceOutcome,
  type BreathingPhaseAdvanceResult,
  type BreathingTimedLoopState,
} from './application/use-cases/ritual/breathe/phase-advance';
export {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from './application/use-cases/ritual/breathe/ritual-audio';
export type { PauseStep } from './domain/pause-ritual-steps';
export type { BriefPauseStep, RitualDepth } from './domain/ritual-types';
export {
  clearSession,
  loadSession,
  saveSession,
} from './infrastructure/session/persisted-session-storage';
