import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
import {
  PRACTICE_XP_BREATH_SECOND_BONUS,
  PRACTICE_XP_BRIEF_BASE,
  PRACTICE_XP_COMPANION_EACH,
  PRACTICE_XP_COMPANION_MAX,
  PRACTICE_XP_DEEP_BASE,
  PRACTICE_XP_FAVORITE_BONUS,
  PRACTICE_XP_NOTE_BONUS,
  PRACTICE_XP_SHIFT_MOOD_BONUS,
} from '@/features/pause/domain/practice/practice-xp-constants';

/**
 * Client-side Presence XP estimate for Done summary — mirrors `computePracticeXpBreakdown`
 * using fields available at decide time (not the server ledger).
 */
export function estimatePresenceXpFromImpact(data: PauseImpactData): number {
  if (data.ritualDepth === 'brief') return PRACTICE_XP_BRIEF_BASE;

  let total = PRACTICE_XP_DEEP_BASE;
  if (data.isFavorite) total += PRACTICE_XP_FAVORITE_BONUS;
  if (data.wroteNote) total += PRACTICE_XP_NOTE_BONUS;
  if (data.engagedTools > 0) {
    total += Math.min(PRACTICE_XP_COMPANION_MAX, PRACTICE_XP_COMPANION_EACH * data.engagedTools);
  }
  if (data.breathingSecondCompleted) total += PRACTICE_XP_BREATH_SECOND_BONUS;
  if (data.shiftMoodLogged) total += PRACTICE_XP_SHIFT_MOOD_BONUS;
  if ((data.companionSlotFavoriteXp ?? 0) > 0) total += data.companionSlotFavoriteXp ?? 0;
  return total;
}
