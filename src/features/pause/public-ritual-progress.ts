/**
 * Ritual stepper / progress chrome — deep + brief step orders and science sheet config.
 * Pure domain — no Supabase.
 */
export type { BriefPauseStep } from './domain/ritual-types';
export {
  BRIEF_PAUSE_ORDER,
  computeBriefMacroProgressPosition,
} from './domain/brief-ritual-steps';
export {
  PAUSE_DEEP_RITUAL_STEPS,
  PAUSE_DEEP_DISPLAY_STEP_COUNT,
  STEPS,
  pauseDeepDisplayProgressIndex,
  pauseDeepMacroStepNumber,
  type PauseStep,
} from './domain/pause-ritual-steps';
export {
  PAUSE_SCIENCE_STEPS,
  type PauseScienceSource,
  type PauseScienceStepConfig,
  type PauseScienceStepKey,
} from './domain/pause-science/pause-science-steps';
export { stepHighlightsScienceRow } from './domain/pause-science/pause-science-step-highlight';
export { briefStepToPauseScienceStep } from './domain/pause-science/brief-step-to-pause-science-step';
