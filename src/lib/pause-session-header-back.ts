import { STEPS, type PauseStep } from '@/components/pause/PauseProgress';
import { BRIEF_PAUSE_ORDER } from '@/lib/brief-pause-order';
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
 */
export function isPauseSessionHeaderBackVisible(p: PauseSessionHeaderBackInput): boolean {
  if (p.phase !== 'session') return false;
  if (p.ritualEntry === 'brief') {
    return (
      BRIEF_PAUSE_ORDER.indexOf(p.briefStep) > 0 ||
      (p.briefStep === 'breath' && p.breathTimedActive) ||
      (p.briefStep === 'breath' && p.breathingFirstCompleted)
    );
  }
  return (
    STEPS.indexOf(p.step) > 0 ||
    ((p.step === 'breathe' || p.step === 'breath2') && p.breathTimedActive) ||
    ((p.step === 'breathe' || p.step === 'breath2') &&
      (p.step === 'breathe' ? p.breathingFirstCompleted : p.breathingSecondCompleted))
  );
}
