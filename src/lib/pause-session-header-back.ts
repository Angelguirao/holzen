import { STEPS, type PauseStep } from '@/components/pause/PauseProgress';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

export type PauseSessionHeaderBackInput = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  step: PauseStep;
  breathTimedActive: boolean;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
};

/**
 * Whether the pause shell should show the header back affordance.
 * Mirrors `showPauseHeaderBack` in `PauseSession` (brief vs non-brief branches).
 *
 * **Brief:** chevron only on **Breathe** (back to Feel). Feel / Integrate / Decide use CTAs only.
 * **Deep:** hidden on **Breathe** (`breathe` / `breath2`); shown on later macro steps.
 */
export function isPauseSessionHeaderBackVisible(p: PauseSessionHeaderBackInput): boolean {
  if (p.phase !== 'session') return false;
  if (p.ritualEntry === 'brief') {
    return p.briefStep === 'breath';
  }
  if (p.step === 'breathe' || p.step === 'breath2') return false;
  return STEPS.indexOf(p.step) > 0;
}

/** Inputs for header back press (no `phase` — visibility is handled separately). */
export type PauseHeaderBackIntentInput = {
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  step: PauseStep;
  breathTimedActive: boolean;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
};

export type PauseHeaderBackIntent =
  | { kind: 'brief_breath_reset_intro' }
  | { kind: 'brief_breath_reset_intro_clear_first' }
  | { kind: 'deep_breath_reset_intro' }
  | { kind: 'deep_breathe_reset_intro_clear_first' }
  | { kind: 'deep_breath2_reset_intro_clear_second' }
  | { kind: 'go_back' };

/**
 * What the pause shell should do when the header back control is pressed
 * (breath intro resets vs ritual `goBack`). Mirrors `handlePauseHeaderBack` in `PauseSession`.
 */
export function computePauseHeaderBackIntent(p: PauseHeaderBackIntentInput): PauseHeaderBackIntent {
  if (p.ritualEntry === 'brief') {
    return { kind: 'go_back' };
  }
  if ((p.step === 'breathe' || p.step === 'breath2') && p.breathTimedActive) return { kind: 'deep_breath_reset_intro' };
  if (p.step === 'breathe' && p.breathingFirstCompleted) return { kind: 'deep_breathe_reset_intro_clear_first' };
  if (p.step === 'breath2' && p.breathingSecondCompleted) return { kind: 'deep_breath2_reset_intro_clear_second' };
  return { kind: 'go_back' };
}
