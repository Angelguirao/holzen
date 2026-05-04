import type { BriefPauseStep } from '@/lib/pause-session-storage';
import { BRIEF_PAUSE_ORDER } from '@/lib/brief-pause-order';

export type BriefRitualGoBackResult = {
  prev: BriefPauseStep;
  clearBriefIntegrateDone: boolean;
};

/**
 * Previous brief step when the user taps Back, plus whether to clear the integrate completion flag.
 * Mirrors the brief branch of `goBack` in `PauseSession`.
 */
export function computeBriefRitualGoBack(current: BriefPauseStep): BriefRitualGoBackResult | null {
  const i = BRIEF_PAUSE_ORDER.indexOf(current);
  if (i <= 0) return null;
  const prev = BRIEF_PAUSE_ORDER[i - 1]!;
  const clearBriefIntegrateDone =
    (current === 'decide' && prev === 'integrate') || current === 'integrate';
  return { prev, clearBriefIntegrateDone };
}
