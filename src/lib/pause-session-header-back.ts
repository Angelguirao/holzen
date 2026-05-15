import { STEPS, type PauseStep } from '@/components/pause/PauseProgress';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

export type PauseSessionHeaderBackInput = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
  step: PauseStep;
  breathTimedActive: boolean;
  /** True after the user starts the triangle countdown on first Breathe (brief or deep); hides shell back until intro again. */
  breathFirstTimedPatternStarted: boolean;
  /** Deep second Breathe: after Start on timed pattern, hide shell back until intro again (wireframe parity with first Breathe). */
  breathSecondTimedPatternStarted: boolean;
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
};

/**
 * Whether the pause shell should show the header back affordance.
 * Mirrors `showPauseHeaderBack` in `PauseSession` (brief vs non-brief branches).
 *
 * **Brief:** chevron on **Breathe** only **before** the timed pattern starts (intro → Feel to change mood).
 * **Deep:** same on **first Breathe** intro only; **second Breathe** matches (back on intro, hidden after Start / interstitial).
 * Hidden on **Reflect** (Continue-only; back returns from **Frame** to add notes); shown from **Frame** onward.
 */
export function isPauseSessionHeaderBackVisible(p: PauseSessionHeaderBackInput): boolean {
  if (p.phase !== 'session') return false;
  if (p.ritualEntry === 'brief') {
    return p.briefStep === 'breath' && !p.breathFirstTimedPatternStarted;
  }
  if (p.step === 'breathe') return !p.breathFirstTimedPatternStarted;
  if (p.step === 'breath2')
    return !(p.breathSecondTimedPatternStarted || p.breathTimedActive || p.breathingSecondCompleted);
  if (p.step === 'reflect') return false;
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
  | { kind: 'deep_breath_reset_intro' }
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
  /** Deep first Breathe: match brief — header back always leaves the segment (→ Feel). */
  if (p.step === 'breathe') {
    return { kind: 'go_back' };
  }
  if (p.step === 'breath2' && p.breathTimedActive) return { kind: 'deep_breath_reset_intro' };
  if (p.step === 'breath2' && p.breathingSecondCompleted) return { kind: 'deep_breath2_reset_intro_clear_second' };
  return { kind: 'go_back' };
}
