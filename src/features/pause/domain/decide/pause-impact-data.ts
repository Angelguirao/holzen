import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseFrameCompanionSlot } from '@/features/pause/domain/done/pause-frame-companion-slots';
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
  /** Profile prefs — not used for Done Frame row display. */
  companionPrefs?: CompanionPrefs | null;
  /** Frame companions the user completed during this pause (deep only). */
  completedFrameCompanions?: readonly PauseFrameCompanionSlot[];
  isFavorite?: boolean;
  /** Shift mood logged on Frame (not hub-only exit) — shift-mood XP bonus. */
  shiftMoodLogged?: boolean;
  companionSlotFavoriteXp?: number;
};
