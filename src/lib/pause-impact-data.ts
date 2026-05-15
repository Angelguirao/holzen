import type { MoodValue } from '@/components/MoodCheck';
import type { RitualDepth } from '@/lib/pause-session-storage';

/** Snapshot passed into the pause “done” / impact shell after a successful Decide. */
export type PauseImpactData = {
  mood: string | null;
  moodAfter: string | null;
  breathingCompleted: boolean;
  decision: string | null;
  context: string | null;
  engagedTools: number;
  wroteNote: boolean;
  usedTags: boolean;
  feelIntensity?: number | null;
  shiftIntensity?: number | null;
  reinforcementQuote?: string | null;
  /** Reflection body at outcome time — for Done-shell share / wallpaper (not on Reflect step). */
  reflectionMessage?: string | null;
  haiku?: string | null;
};

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
