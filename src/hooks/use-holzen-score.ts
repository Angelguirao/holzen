import { useMemo } from 'react';
import { parseISO } from 'date-fns';

interface Reflection {
  created_at: string;
  mood: string | null;
  mood_after?: string | null;
  outcome: string | null;
}

interface PracticeEntry {
  created_at: string;
  type: string;
  mood: string | null;
}

const MOOD_SCORES: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

const OUTCOME_SCORES: Record<string, number> = {
  held: 100,
  nothing: 100,
  bought: 50,
  sold: 20,
};


export interface HolzenScoreData {
  score: number;
  moodScore: number;
  deltaScore: number;
  outcomeScore: number;
  practiceScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

export function useHolzenScore(reflections: Reflection[], freezeDates: string[] = [], practiceEntries: PracticeEntry[] = []): HolzenScoreData | null {
  return useMemo(() => {
    if (reflections.length < 3) return null;

    // Use last 30 reflections for scoring
    const recent = reflections.slice(0, 30);

    // Mood score (15%) — include check-in moods
    const reflectionMoods = recent.filter((r) => r.mood && MOOD_SCORES[r.mood] !== undefined);
    const checkinMoods = practiceEntries
      .filter((p) => p.type === 'checkin' && p.mood && MOOD_SCORES[p.mood] !== undefined)
      .slice(0, 20);
    const allMoods = [
      ...reflectionMoods.map(r => MOOD_SCORES[r.mood!] ?? 60),
      ...checkinMoods.map(p => MOOD_SCORES[p.mood!] ?? 60),
    ];
    const moodAvg = allMoods.length > 0
      ? allMoods.reduce((s, v) => s + v, 0) / allMoods.length
      : 60;

    // Grounding delta score (35%) — measures before→after improvement from pause flow
    const withDelta = recent.filter(
      (r) => r.mood && r.mood_after && MOOD_SCORES[r.mood] !== undefined && MOOD_SCORES[r.mood_after] !== undefined
    );
    let deltaAvg = 50; // neutral default
    if (withDelta.length > 0) {
      const deltas = withDelta.map(r => {
        const before = MOOD_SCORES[r.mood!] ?? 50;
        const after = MOOD_SCORES[r.mood_after!] ?? 50;
        return Math.min(100, Math.max(0, 50 + (after - before)));
      });
      deltaAvg = deltas.reduce((s, v) => s + v, 0) / deltas.length;
    }

    // Outcome score (30%)
    const outcomesWithScore = recent.filter((r) => r.outcome && OUTCOME_SCORES[r.outcome] !== undefined);
    const outcomeAvg =
      outcomesWithScore.length > 0
        ? outcomesWithScore.reduce((sum, r) => sum + (OUTCOME_SCORES[r.outcome!] ?? 50), 0) / outcomesWithScore.length
        : 50;

    // Practice engagement score (20%) — rewards consistent practice
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentPractice = practiceEntries.filter(p => new Date(p.created_at) >= last30Days);
    const uniquePracticeDays = new Set(recentPractice.map(p => parseISO(p.created_at).toISOString().slice(0, 10))).size;
    const practicePct = Math.min(uniquePracticeDays / 10, 1) * 100;

    // Weights: Mood 15%, Delta 35%, Outcome 30%, Practice 20%
    const score = Math.round(moodAvg * 0.15 + deltaAvg * 0.35 + outcomeAvg * 0.30 + practicePct * 0.20);

    // Trend
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
      deltaScore: Math.round(deltaAvg),
      outcomeScore: Math.round(outcomeAvg),
      practiceScore: Math.round(practicePct),
      trend,
    };
  }, [reflections, freezeDates, practiceEntries]);
}
