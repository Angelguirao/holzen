import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseFrameCompanionSlot } from '@/features/pause/domain/done/pause-frame-companion-slots';
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
  reflectionMessage: string;
  haiku: string | null;
  ritualStartedAtMs: number | null;
  companionPrefs: CompanionPrefs;
  isFavorite: boolean;
  wroteNote?: boolean;
  usedTags?: boolean;
  engagedTools?: number;
  completedFrameCompanions?: readonly PauseFrameCompanionSlot[];
  companionSlotFavoriteXp?: number;
};

function resolveRitualDepth(ritualEntry: RitualDepth | 'picker'): RitualDepth {
  return ritualEntry === 'brief' ? 'brief' : 'deep';
}

/** Builds the payload for `setPauseImpactData` after `outcome_logged` succeeds. */
export function buildPauseImpactDataOnComplete(p: BuildPauseImpactDataOnCompleteInput): PauseImpactData {
  const ritualDepth = resolveRitualDepth(p.ritualEntry);
  const completedAtMs = Date.now();
  const ritualDurationMs =
    p.ritualStartedAtMs != null && p.ritualStartedAtMs > 0
      ? Math.max(0, completedAtMs - p.ritualStartedAtMs)
      : null;

  return {
    mood: p.selectedMood,
    moodAfter: p.selectedMoodAfter,
    breathingCompleted:
      p.ritualEntry === 'brief'
        ? p.breathingFirstCompleted
        : p.breathingFirstCompleted && p.breathingSecondCompleted,
    breathingSecondCompleted: p.breathingSecondCompleted,
    decision: p.decision,
    context: p.context,
    engagedTools: p.engagedTools ?? 0,
    wroteNote: p.wroteNote ?? false,
    usedTags: p.usedTags ?? false,
    feelIntensity: p.feelIntensity,
    shiftIntensity: p.shiftIntensity,
    reflectionMessage: p.reflectionMessage.trim() || null,
    haiku: p.haiku?.trim() ? p.haiku.trim() : null,
    ritualDepth,
    ritualDurationMs,
    companionPrefs: p.companionPrefs,
    completedFrameCompanions: p.completedFrameCompanions ?? [],
    isFavorite: p.isFavorite,
    shiftMoodLogged: p.selectedMoodAfter != null,
    companionSlotFavoriteXp: p.companionSlotFavoriteXp ?? 0,
  };
}
