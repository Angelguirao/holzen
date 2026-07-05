/**
 * Ritual stepper / progress chrome — deep + brief step orders.
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
