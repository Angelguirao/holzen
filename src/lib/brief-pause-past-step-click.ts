import { BRIEF_PAUSE_ORDER } from '@/lib/brief-pause-order';
import type { BriefPauseStep } from '@/lib/pause-session-storage';

export type BriefPastStepClickResult = {
  target: BriefPauseStep;
  clearBriefIntegrateDone: boolean;
};

/**
 * When the user taps an earlier brief macro in the progress bar, returns the
 * navigation target and whether to clear the integrate-completion flag.
 * `null` if the tap is not allowed (same step or future step).
 * Mirrors `goToBriefPastStep` in `PauseSession`.
 */
export function computeBriefPastStepClick(
  target: BriefPauseStep,
  current: BriefPauseStep,
): BriefPastStepClickResult | null {
  const ti = BRIEF_PAUSE_ORDER.indexOf(target);
  const ci = BRIEF_PAUSE_ORDER.indexOf(current);
  if (ti >= ci) return null;
  return {
    target,
    clearBriefIntegrateDone: target === 'breath' || target === 'feel',
  };
}
