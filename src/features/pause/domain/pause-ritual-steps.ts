/** Full deep-ritual routing order (matches header stepper beats). */
export const PAUSE_DEEP_RITUAL_STEPS = ['feel', 'breathe', 'reflect', 'frame', 'breath2', 'decide'] as const;

export type PauseStep = (typeof PAUSE_DEEP_RITUAL_STEPS)[number];

/** @deprecated Prefer `PAUSE_DEEP_RITUAL_STEPS` — kept for step-map imports. */
export const STEPS = PAUSE_DEEP_RITUAL_STEPS;

/** Six segments in the deep-pause shell. */
const PAUSE_DEEP_DISPLAY_STEPS = PAUSE_DEEP_RITUAL_STEPS;

export const PAUSE_DEEP_DISPLAY_STEP_COUNT = PAUSE_DEEP_DISPLAY_STEPS.length;

/** 1-based “Step n of 6” for the meta line. */
export function pauseDeepMacroStepNumber(step: PauseStep): number {
  if (step === 'decide') return PAUSE_DEEP_DISPLAY_STEP_COUNT;
  return PAUSE_DEEP_RITUAL_STEPS.indexOf(step) + 1;
}

/** Index for deep-pause header stepper progress (0-based). */
export function pauseDeepDisplayProgressIndex(step: PauseStep): number {
  if (step === 'decide') {
    return PAUSE_DEEP_DISPLAY_STEPS.indexOf('decide');
  }
  return PAUSE_DEEP_DISPLAY_STEPS.indexOf(step as (typeof PAUSE_DEEP_DISPLAY_STEPS)[number]);
}
