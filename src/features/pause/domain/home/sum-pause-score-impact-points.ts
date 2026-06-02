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
 * Ritual signal bonus weights for Home Presence XP — aligned with
 * {@link buildPauseScoreImpacts} `points` (Done screen uses the same events for copy only).
 * See docs/systems/stats-system.md § Pause-first MVP — Practice Presence XP.
 */
export function sumPauseScoreImpactPoints(
  data: PauseImpactData,
  variant: 'default' | 'brief',
): number {
  let total = 0;

  if (data.breathingCompleted) {
    total += 4;
  } else if (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]) {
    total += 5;
  }

  if (data.engagedTools > 0) {
    total += Math.min(6, 2 * data.engagedTools);
  }

  if (data.wroteNote || data.usedTags) {
    total += 3;
  }

  if (variant === 'brief' && data.decision) {
    total += 2;
    const hasRegulation =
      data.breathingCompleted ||
      (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]);
    if (data.mood && !hasRegulation) {
      total += 2;
    }
  }

  return total;
}
