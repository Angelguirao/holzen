import { useMemo } from 'react';
import { filterCompleted } from '@/lib/engaged-pause';

interface Reflection {
  created_at: string;
  mood: string | null;
  mood_after?: string | null;
  outcome: string | null;
  context?: string | null;
  breathing_completed?: boolean;
  note?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
  signal_read?: boolean;
  grounding_read?: boolean;
}

interface PracticeEntry {
  created_at: string;
  type: string;
  mood: string | null;
}

interface HoldGoal {
  type: string | null;
  targetMonths: number | null;
  targetPrice: number | null;
  start: string | null;
}

const MOOD_SCORES: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

// Composure scores: calm/detached = composed, fomo/greedy/fearful = reactive
const COMPOSURE: Record<string, number> = {
  calm: 100, detached: 85, uncertain: 60, excited: 50,
  anxious: 30, fearful: 25, greedy: 20, fomo: 10,
};

export interface HolzenScoreData {
  score: number;
  emotionalRegulation: number;
  distressTolerance: number;
  decisionAlignment: number;
  cognitiveReappraisal: number;
  selfAwareness: number;
  trend: 'improving' | 'declining' | 'stable';
}

/** Parse volatility % from context string like "BTC ↑5.2% in 24h" */
function parseVolatility(context: string | null | undefined): number {
  if (!context) return 0;
  const match = context.match(/[↑↓](\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

/** Tiered volatility multiplier: <3% = 1, 3-7% = 1.5, >7% = 2 */
function volatilityTier(pct: number): number {
  if (pct >= 7) return 2;
  if (pct >= 3) return 1.5;
  return 1;
}

export function useHolzenScore(
  reflections: Reflection[],
  _freezeDates: string[] = [],
  practiceEntries: PracticeEntry[] = [],
  holdGoal?: HoldGoal | null,
): HolzenScoreData | null {
  return useMemo(() => {
    // Only count completed pauses (those with a recorded decision).
    // Ignored-notification rows have no outcome and are excluded by construction.
    const completed = filterCompleted(reflections);
    if (completed.length < 1) return null;

    const recent = completed.slice(0, 30);
    const hasHoldGoal = holdGoal?.type != null;

    // --- WEIGHTS (redistribute Decision Alignment if no hold goal) ---
    let wEmotional = 0.30;
    let wDistress = 0.25;
    let wDecision = 0.20;
    let wReappraisal = 0.15;
    let wAwareness = 0.10;

    if (!hasHoldGoal) {
      // Redistribute 20% across other 4 skills proportionally
      const redistrib = wDecision;
      wDecision = 0;
      const otherTotal = wEmotional + wDistress + wReappraisal + wAwareness;
      wEmotional += redistrib * (wEmotional / otherTotal);
      wDistress += redistrib * (wDistress / otherTotal);
      wReappraisal += redistrib * (wReappraisal / otherTotal);
      wAwareness += redistrib * (wAwareness / otherTotal);
    }

    // ─── 1. EMOTIONAL REGULATION (30%) ───
    // Measures mood→mood_after improvement + breathing completion
    const withDelta = recent.filter(
      r => r.mood && r.mood_after && COMPOSURE[r.mood] !== undefined && COMPOSURE[r.mood_after] !== undefined
    );
    let emotionalScore = 50;
    if (withDelta.length > 0) {
      const deltas = withDelta.map(r => {
        const before = COMPOSURE[r.mood!] ?? 50;
        const after = COMPOSURE[r.mood_after!] ?? 50;
        // Shift from reactive→composed = positive, capped 0-100
        const delta = Math.min(100, Math.max(0, 50 + (after - before)));
        // Breathing bonus: +10 if completed
        const breathingBonus = r.breathing_completed ? 10 : 0;
        return Math.min(100, delta + breathingBonus);
      });
      emotionalScore = deltas.reduce((s, v) => s + v, 0) / deltas.length;
    }

    // ─── 2. DISTRESS TOLERANCE (25%) ───
    // Did you hold/do nothing during high volatility? Weighted penalty for selling.
    const withOutcomeAndContext = recent.filter(r => r.outcome && r.context);
    let distressScore = 50;
    if (withOutcomeAndContext.length > 0) {
      const scores = withOutcomeAndContext.map(r => {
        const vol = parseVolatility(r.context);
        const tier = volatilityTier(vol);
        const outcome = r.outcome!;
        if (outcome === 'held' || outcome === 'nothing') {
          // Reward: higher for higher volatility
          return Math.min(100, 60 + tier * 20);
        } else if (outcome === 'sold') {
          // Weighted penalty: bigger during high vol
          return Math.max(0, 40 - tier * 15);
        } else if (outcome === 'bought') {
          // Mild: buying is less impulsive than selling
          return 45;
        }
        return 50;
      });
      distressScore = scores.reduce((s, v) => s + v, 0) / scores.length;
    }

    // ─── 3. DECISION ALIGNMENT (20%) ───
    // How well do outcomes align with hold goal?
    let decisionScore = 50;
    if (hasHoldGoal) {
      const withOutcome = recent.filter(r => r.outcome);
      if (withOutcome.length > 0) {
        const scores = withOutcome.map(r => {
          const o = r.outcome!;
          if (holdGoal!.type === 'forever') {
            // Forever: held/nothing = 100, bought = 60, sold = 15
            return o === 'held' || o === 'nothing' ? 100 : o === 'bought' ? 60 : 15;
          }
          // Time or price based: holding is aligned
          return o === 'held' || o === 'nothing' ? 100 : o === 'bought' ? 50 : 20;
        });
        decisionScore = scores.reduce((s, v) => s + v, 0) / scores.length;
      }
    }

    // ─── 4. COGNITIVE REAPPRAISAL (15%) ───
    // Engaging with perspective-shifting tools. Weighted higher during volatility.
    const reappraisalTools = recent.map(r => {
      const engaged = [r.zoom_out_read, r.history_read, r.signal_read, r.grounding_read]
        .filter(Boolean).length; // 0-4
      const vol = parseVolatility(r.context);
      const volMultiplier = vol >= 3 ? 1.5 : 1; // bonus during volatile moments
      return Math.min(100, (engaged / 4) * 100 * volMultiplier);
    });
    const reappraisalScore = reappraisalTools.length > 0
      ? reappraisalTools.reduce((s, v) => s + v, 0) / reappraisalTools.length
      : 0;

    // ─── 5. SELF-AWARENESS (10%) ───
    // Depth of reflection: notes, tags, favorites
    const awarenessScores = recent.map(r => {
      let depth = 0;
      if (r.note && r.note.length > 10) depth += 40;
      else if (r.note && r.note.length > 0) depth += 20;
      if (r.tags && r.tags.length > 0) depth += 30;
      if (r.is_favorite) depth += 15;
      // Having a mood_after means they completed the full pause flow
      if (r.mood_after) depth += 15;
      return Math.min(100, depth);
    });
    const awarenessScore = awarenessScores.reduce((s, v) => s + v, 0) / awarenessScores.length;

    // ─── COMPOSITE SCORE ───
    const score = Math.round(
      emotionalScore * wEmotional +
      distressScore * wDistress +
      decisionScore * wDecision +
      reappraisalScore * wReappraisal +
      awarenessScore * wAwareness
    );

    // ─── TREND (based on emotional regulation trajectory) ───
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recent.length >= 6) {
      const mid = Math.floor(recent.length / 2);
      const older = recent.slice(mid);
      const newer = recent.slice(0, mid);

      const avgComposure = (arr: Reflection[]) => {
        const withMood = arr.filter(r => r.mood_after && COMPOSURE[r.mood_after]);
        if (withMood.length === 0) return 50;
        return withMood.reduce((s, r) => s + (COMPOSURE[r.mood_after!] ?? 50), 0) / withMood.length;
      };

      const diff = avgComposure(newer) - avgComposure(older);
      if (diff > 10) trend = 'improving';
      else if (diff < -10) trend = 'declining';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      emotionalRegulation: Math.round(emotionalScore),
      distressTolerance: Math.round(distressScore),
      decisionAlignment: Math.round(decisionScore),
      cognitiveReappraisal: Math.round(reappraisalScore),
      selfAwareness: Math.round(awarenessScore),
      trend,
    };
  }, [reflections, _freezeDates, practiceEntries, holdGoal]);
}
