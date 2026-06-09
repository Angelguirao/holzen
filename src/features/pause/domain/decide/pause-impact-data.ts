import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

/** Snapshot passed into the pause “done” / impact shell after a successful Decide. */
export type PauseImpactData = {
  mood: string | null;
  moodAfter: string | null;
  breathingCompleted: boolean;
  /** Second breath segment completed (deep ritual XP bonus). */
  breathingSecondCompleted?: boolean;
  decision: string | null;
  context: string | null;
  engagedTools: number;
  wroteNote: boolean;
  usedTags: boolean;
  feelIntensity?: number | null;
  shiftIntensity?: number | null;
  reflectionMessage?: string | null;
  haiku?: string | null;
  ritualDepth: RitualDepth;
  ritualDurationMs?: number | null;
  companionPrefs?: CompanionPrefs | null;
  isFavorite?: boolean;
};
