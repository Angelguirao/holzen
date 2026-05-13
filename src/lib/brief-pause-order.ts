import type { BriefPauseStep } from '@/lib/pause-session-storage';

/** Canonical macro order for the brief pause ritual (UI + navigation must stay aligned). */
export const BRIEF_PAUSE_ORDER: readonly BriefPauseStep[] = ['feel', 'breath', 'integrate', 'decide'];

/** 1-based index and total count for the brief ritual progress copy (`pause.brief.macroStepCount`). */
export function computeBriefMacroProgressPosition(current: BriefPauseStep): { n: number; total: number } {
  return {
    n: BRIEF_PAUSE_ORDER.indexOf(current) + 1,
    total: BRIEF_PAUSE_ORDER.length,
  };
}
