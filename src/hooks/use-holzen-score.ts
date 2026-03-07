import { useMemo } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface Reflection {
  created_at: string;
  mood: string | null;
  outcome: string | null;
}

const MOOD_SCORES: Record<string, number> = {
  calm: 100,
  neutral: 60,
  anxious: 20,
};

const OUTCOME_SCORES: Record<string, number> = {
  held: 100,
  nothing: 100,
  bought: 50,
  sold: 20,
};

function computeCurrentStreak(reflections: Reflection[], freezeDates: string[] = []): number {
  if (reflections.length === 0) return 0;

  const days = new Set<string>();
  for (const r of reflections) {
    days.add(parseISO(r.created_at).toISOString().slice(0, 10));
  }
  // Add freeze dates as "valid" days
  for (const d of freezeDates) {
    days.add(d);
  }
  const sorted = Array.from(days).sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  const daysSinceLast = differenceInCalendarDays(new Date(today), new Date(sorted[0]));
  if (daysSinceLast > 1) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(new Date(sorted[i - 1]), new Date(sorted[i]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export interface HolzenScoreData {
  score: number;
  moodScore: number;
  outcomeScore: number;
  streakScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

export function useHolzenScore(reflections: Reflection[], freezeDates: string[] = []): HolzenScoreData | null {
  return useMemo(() => {
    if (reflections.length < 3) return null;

    // Use last 30 reflections for scoring
    const recent = reflections.slice(0, 30);

    // Mood score (40%)
    const moodsWithScore = recent.filter((r) => r.mood && MOOD_SCORES[r.mood] !== undefined);
    const moodAvg =
      moodsWithScore.length > 0
        ? moodsWithScore.reduce((sum, r) => sum + (MOOD_SCORES[r.mood!] ?? 60), 0) / moodsWithScore.length
        : 60;

    // Outcome score (35%)
    const outcomesWithScore = recent.filter((r) => r.outcome && OUTCOME_SCORES[r.outcome] !== undefined);
    const outcomeAvg =
      outcomesWithScore.length > 0
        ? outcomesWithScore.reduce((sum, r) => sum + (OUTCOME_SCORES[r.outcome!] ?? 50), 0) / outcomesWithScore.length
        : 50;

    // Streak score (25%) — capped at 14 days
    const streak = computeCurrentStreak(reflections);
    const streakPct = Math.min(streak / 14, 1) * 100;

    const score = Math.round(moodAvg * 0.4 + outcomeAvg * 0.35 + streakPct * 0.25);

    // Trend: compare first half vs second half of recent reflections
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recent.length >= 6) {
      const mid = Math.floor(recent.length / 2);
      const olderHalf = recent.slice(mid);
      const newerHalf = recent.slice(0, mid);

      const avgMood = (arr: Reflection[]) => {
        const withMood = arr.filter((r) => r.mood && MOOD_SCORES[r.mood]);
        if (withMood.length === 0) return 60;
        return withMood.reduce((s, r) => s + (MOOD_SCORES[r.mood!] ?? 60), 0) / withMood.length;
      };

      const diff = avgMood(newerHalf) - avgMood(olderHalf);
      if (diff > 10) trend = 'improving';
      else if (diff < -10) trend = 'declining';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      moodScore: Math.round(moodAvg),
      outcomeScore: Math.round(outcomeAvg),
      streakScore: Math.round(streakPct),
      trend,
    };
  }, [reflections]);
}
