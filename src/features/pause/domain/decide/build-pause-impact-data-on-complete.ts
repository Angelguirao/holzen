import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

export type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';

export type BuildPauseImpactDataOnCompleteInput = {
  decision: string;
  context: string | null;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  ritualEntry: RitualDepth | 'picker';
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  feelIntensity: number | null;
  shiftIntensity: number | null;
  reinforcementQuote: string;
  reflectionMessage: string;
  haiku: string | null;
};

/** Builds the payload for `setPauseImpactData` after `outcome_logged` succeeds. */
export function buildPauseImpactDataOnComplete(p: BuildPauseImpactDataOnCompleteInput): PauseImpactData {
  return {
    mood: p.selectedMood,
    moodAfter: p.selectedMoodAfter,
    breathingCompleted:
      p.ritualEntry === 'brief'
        ? p.breathingFirstCompleted
        : p.breathingFirstCompleted && p.breathingSecondCompleted,
    decision: p.decision,
    context: p.context,
    engagedTools: 0,
    wroteNote: false,
    usedTags: false,
    feelIntensity: p.feelIntensity,
    shiftIntensity: p.shiftIntensity,
    reinforcementQuote: p.reinforcementQuote,
    reflectionMessage: p.reflectionMessage.trim() || null,
    haiku: p.haiku?.trim() ? p.haiku.trim() : null,
  };
}
