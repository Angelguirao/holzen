import type { PauseStep } from '@/components/pause/PauseProgress';
import { computeBriefRitualGoBack } from '@/lib/brief-pause-go-back';
import { computeDeepRitualGoBackTarget } from '@/lib/pause-deep-go-back';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

export type PauseGoBackPlan =
  | { kind: 'brief'; prev: BriefPauseStep; clearBriefIntegrateDone: boolean }
  | { kind: 'deep'; prev: PauseStep }
  | { kind: 'none' };

/**
 * Single entry for header/hardware back one step in the pause ritual.
 * Brief uses `BRIEF_PAUSE_ORDER`; all other `ritualEntry` values use deep `STEPS`.
 */
export function computePauseGoBackPlan(
  ritualEntry: RitualDepth | 'picker',
  briefStep: BriefPauseStep,
  step: PauseStep,
): PauseGoBackPlan {
  if (ritualEntry === 'brief') {
    const r = computeBriefRitualGoBack(briefStep);
    if (!r) return { kind: 'none' };
    return { kind: 'brief', prev: r.prev, clearBriefIntegrateDone: r.clearBriefIntegrateDone };
  }
  const prevDeep = computeDeepRitualGoBackTarget(step);
  if (prevDeep === null) return { kind: 'none' };
  return { kind: 'deep', prev: prevDeep };
}
