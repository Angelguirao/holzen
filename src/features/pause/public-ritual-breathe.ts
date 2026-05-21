/**
 * Breathe ritual beat — screen-facing pure helpers and presentation hooks.
 * Phase advance + segment RPC flags stay on `public-session.ts`; mutations on `public-rpc.ts`.
 */
export {
  usePauseBreathingTimedLoop,
  type UsePauseBreathingTimedLoopInput,
} from './presentation/session/use-pause-breathing-timed-loop';
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
