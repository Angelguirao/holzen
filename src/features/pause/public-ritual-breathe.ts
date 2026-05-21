/**
 * Breathe ritual beat — screen-facing pure helpers and presentation hooks.
 * Segment RPC dedupe/outcome helpers live here; mutations on `public-rpc.ts`.
 */
export { applyBreathSegmentLogOutcome } from './domain/ritual/breathe/apply-breath-segment-log-outcome';
export { initialBreathSegmentRpcLoggedFlagsFromRestored } from './domain/ritual/breathe/initial-breath-segment-rpc-flags';
export {
  usePauseBreathingTimedLoop,
  type UsePauseBreathingTimedLoopInput,
} from './presentation/session/breath/use-pause-breathing-timed-loop';
export { resolveBreathOrbVisualMetrics } from './application/use-cases/ritual/breathe/pause-breath-orb-metrics';
export {
  resolvePauseBreathingTimedDisplay,
  type PauseBreathingTimedDisplay,
} from './application/use-cases/ritual/breathe/resolve-pause-breathing-timed-display';
export {
  resolveTriangleKickerDisplay,
  type TriangleKickerDisplay,
} from './application/use-cases/ritual/breathe/resolve-triangle-kicker-display';
export {
  BRIEF_TRIANGLE_CYCLE_COUNT,
  BOX_BREATH_PHASE_COUNT,
  holdProgressWithinPhase,
  parseTriangleRotatingKickersI18n,
  PAUSE_RITUAL_BREATHING_PATTERN_MODE,
  resolveBreathCycleTotal,
  resolvePauseBreathingPhases,
  rotatingKickerIndexFromElapsed,
  RITUAL_TRIANGLE_KICKER_INTERVAL_SEC,
  secondsIntoTrianglePattern,
  TRIANGLE_PHASE_COUNT,
  type PauseRitualBreathingPatternMode,
} from './application/use-cases/ritual/breathe/ritual-pattern';
export {
  STANDALONE_BREATHING_CYCLE_COUNT,
  STANDALONE_BREATHING_PATTERNS,
  resolveStandaloneBreathSeverityRingColors,
  resolveSuggestedStandaloneBreathingPatternIndex,
  type BreathingExerciseSeverity,
  type StandaloneBreathingPattern,
  type StandaloneBreathSeverityRingColors,
  type StandaloneBreathingPhase,
} from './application/use-cases/ritual/breathe/standalone-breathing-patterns';
export type { PauseBreathingPhase } from './domain/ritual/breathe/pause-breathing-phase';
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
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from './application/use-cases/ritual/breathe/breath-second-label-variant';
export { usePauseSessionBreathStepHandlers } from './presentation/session/breath/use-pause-session-breath-step-handlers';
export {
  usePauseSessionBreathHandlers,
  type UsePauseSessionBreathHandlersParams,
} from './presentation/session/breath/use-pause-session-breath-handlers';
export { usePauseSessionBreathReflectHandlers } from './presentation/session/breath/use-pause-session-breath-reflect-handlers';
