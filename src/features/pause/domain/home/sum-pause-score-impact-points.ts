import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';

const COMPOSURE: Record<string, number> = {
  fomo: 10,
  greedy: 15,
  anxious: 20,
  fearful: 25,
  excited: 40,
  uncertain: 50,
  detached: 75,
  calm: 100,
};

/**
 * Small ritual-signal bonus for Home Presence XP (weaker than Done-screen copy weights).
 * See docs/systems/home-practice-presence-xp.md.
 */
export function sumPausePracticeBonusPoints(
  data: PauseImpactData,
  variant: 'default' | 'brief',
): number {
  let total = 0;

  if (data.breathingCompleted) {
    total += 1;
  } else if (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]) {
    total += 1;
  }

  if (data.engagedTools > 0) {
    total += Math.min(2, data.engagedTools);
  }

  if (data.wroteNote || data.usedTags) {
    total += 1;
  }

  if (variant === 'brief' && data.decision) {
    total += 1;
    const hasRegulation =
      data.breathingCompleted ||
      (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]);
    if (data.mood && !hasRegulation) {
      total += 1;
    }
  }

  return total;
}
