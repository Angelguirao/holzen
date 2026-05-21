/**
 * Pause session shell pure helpers (no Supabase).
 * Presentation hooks import from here instead of deep `application/use-cases/session/*`.
 */
export { pauseStepLayout } from './presentation/session/pause-step-layout';
export {
  computePauseHeaderBackIntent,
  isPauseSessionHeaderBackVisible,
  type PauseHeaderBackIntent,
  type PauseHeaderBackIntentInput,
  type PauseSessionHeaderBackInput,
} from './application/use-cases/session/header-back';
export {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
  type PauseSessionStepTransitionConfig,
  type PauseSessionSwipeDirection,
} from './application/use-cases/session/step-transition';
export { pauseStepSwipeDirection } from './application/use-cases/session/step-swipe-direction';
export {
  hasPersistablePauseSessionAnchor,
  hasPersistedPauseSessionPayload,
  type PersistedSessionAnchor,
} from './domain/session/persisted-session-guards';
export { isPauseSessionDepthPickerActive } from './domain/reflect/mood/pause-depth-picker-active';
export { isPauseSessionWaitingForInstanceFetch } from './domain/session/waiting-for-instance-fetch';
export {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './application/use-cases/session/terminal-entry-guard';
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
export { getSessionQuote, type WisdomQuote } from './application/use-cases/ritual/decide/wisdom-quotes';
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  type PauseDecideOutcomeFlow,
} from './application/use-cases/ritual/decide/pause-decide-outcome-flow';
export {
  clearSession,
  loadSession,
  saveSession,
} from './infrastructure/session/persisted-session-storage';
