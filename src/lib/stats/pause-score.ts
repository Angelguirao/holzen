/**
 * Pause V2 skill-score computation.
 *
 * Consumes `pause_instances + v_pause_full` rows and their event streams,
 * produces the same 5-skill shape the legacy `useHolzenScore` returned
 * (EmotionalRegulation / DistressTolerance / DecisionAlignment /
 * CognitiveReappraisal / SelfAwareness) plus the composite Holzen Score.
 *
 * Rules mirror the legacy ones so the hero ring reads the same during
 * cutover — the semantic change is "reads from the new model" not "new
 * scoring formula". Any future rebalance lands as a separate, named
 * version bump.
 *
 * Inputs:
 *   - completedRows: `v_pause_full` rows with `state='completed'`.
 *   - stepEvents / companionEvents: raw event streams, trimmed to the
 *     completed window the caller has already computed.
 *   - holdGoal: optional; when null, Decision Alignment weight is
 *     redistributed across the other four skills (same as legacy).
 */

import type {
  PauseStepEventRow,
  PauseCompanionEventRow,
} from '@/lib/pause-state';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';
import {
  effectivePauseShiftMood,
  hasPauseShiftOrPostEmotion,
} from '@/lib/pause-effective-emotion';

interface HoldGoal {
  type: string | null;
  targetMonths: number | null;
  targetPrice: number | null;
  start: string | null;
}

const COMPOSURE: Record<string, number> = {
  calm: 100,
  detached: 85,
  uncertain: 60,
  excited: 50,
  anxious: 30,
  fearful: 25,
  greedy: 20,
  fomo: 10,
};

/**
 * Volatility context derived from `pause_instances.context_snapshot`.
 *
 * `pctAbs` is the magnitude of the price move (always >= 0) used by tier and
 * companion-engagement multipliers. `direction` exposes the sign so the
 * scoring branches can tell a dip-buy apart from a chase-buy without scanning
 * the raw payload again.
 */
type VolatilityDirection = 'up' | 'down' | 'flat';
interface VolatilityContext {
  pctAbs: number;
  direction: VolatilityDirection;
}

function parseVolatility(contextSnapshot: Record<string, unknown> | null): VolatilityContext {
  if (!contextSnapshot) return { pctAbs: 0, direction: 'flat' };
  const raw =
    contextSnapshot.change_24h_pct ??
    contextSnapshot.change_7d_pct ??
    contextSnapshot.cumulativeChangePercent ??
    contextSnapshot.changePercent ??
    0;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return { pctAbs: 0, direction: 'flat' };
  const direction: VolatilityDirection = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  return { pctAbs: Math.abs(n), direction };
}

function volatilityTier(pct: number): number {
  if (pct >= 7) return 2;
  if (pct >= 3) return 1.5;
  return 1;
}

export interface PauseScoreData {
  score: number;
  emotionalRegulation: number;
  distressTolerance: number;
  decisionAlignment: number;
  cognitiveReappraisal: number;
  selfAwareness: number;
  trend: 'improving' | 'declining' | 'stable';
  /** Sample size (completed instances used in the window). */
  sampleSize: number;
}

export function computePauseScore(params: {
  completedRows: readonly PauseFullRow[];
  stepEvents: readonly PauseStepEventRow[];
  companionEvents: readonly PauseCompanionEventRow[];
  holdGoal?: HoldGoal | null;
}): PauseScoreData | null {
  const { completedRows, companionEvents, holdGoal } = params;

  if (completedRows.length < 1) return null;
  const recent = completedRows.slice(0, 30);

  const hasHoldGoal = holdGoal?.type != null;

  let wEmotional = 0.3;
  let wDistress = 0.25;
  let wDecision = 0.2;
  let wReappraisal = 0.15;
  let wAwareness = 0.1;

  if (!hasHoldGoal) {
    const redistrib = wDecision;
    wDecision = 0;
    const otherTotal = wEmotional + wDistress + wReappraisal + wAwareness;
    wEmotional += redistrib * (wEmotional / otherTotal);
    wDistress += redistrib * (wDistress / otherTotal);
    wReappraisal += redistrib * (wReappraisal / otherTotal);
    wAwareness += redistrib * (wAwareness / otherTotal);
  }

  // --- 1. Emotional Regulation ---
  const withDelta = recent.filter((r) => {
    const afterMood = effectivePauseShiftMood(r);
    return (
      r.initial_mood &&
      afterMood &&
      COMPOSURE[r.initial_mood] !== undefined &&
      COMPOSURE[afterMood] !== undefined
    );
  });
  let emotionalScore = 50;
  if (withDelta.length > 0) {
    const deltas = withDelta.map((r) => {
      const afterMood = effectivePauseShiftMood(r)!;
      const before = COMPOSURE[r.initial_mood!] ?? 50;
      const after = COMPOSURE[afterMood] ?? 50;
      const delta = Math.min(100, Math.max(0, 50 + (after - before)));
      const breathBonus = r.has_breath_completed ? 10 : 0;
      return Math.min(100, delta + breathBonus);
    });
    emotionalScore = deltas.reduce((s, v) => s + v, 0) / deltas.length;
  }

  // --- 2. Distress Tolerance ---
  // Outcome scoring is intentionally context-aware for `bought`: a dip-buy
  // (direction='down') reads as conviction-aligned with the volatility, a
  // chase-buy (direction='up') reads as reactive. Without a clear direction
  // we fall back to the legacy neutral 45. See docs/systems/stats-system.md
  // "Outcome scoring matrix" for the canonical (outcome, tier, direction) map.
  // Historical `nothing` rows (legacy alias) score as the catch-all 50; the
  // live UI no longer emits that value (see migration
  // 20260519120000_pause_log_step_main_outcome_validation.sql).
  const withOutcomeAndContext = recent.filter((r) => r.outcome && r.context_snapshot);
  let distressScore = 50;
  if (withOutcomeAndContext.length > 0) {
    const scores = withOutcomeAndContext.map((r) => {
      const { pctAbs, direction } = parseVolatility(r.context_snapshot);
      const tier = volatilityTier(pctAbs);
      const o = r.outcome!;
      if (o === 'held') return Math.min(100, 60 + tier * 20);
      if (o === 'sold') return Math.max(0, 40 - tier * 15);
      if (o === 'bought') {
        if (direction === 'down') return Math.min(100, 50 + tier * 10);
        if (direction === 'up') return Math.max(0, 50 - tier * 10);
        return 45;
      }
      return 50;
    });
    distressScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  }

  // --- 3. Decision Alignment ---
  // Only `held` is hold-aligned; legacy `nothing` rows fall through to 50.
  let decisionScore = 50;
  if (hasHoldGoal) {
    const withOutcome = recent.filter((r) => r.outcome);
    if (withOutcome.length > 0) {
      const scores = withOutcome.map((r) => {
        const o = r.outcome!;
        if (o === 'held') return 100;
        if (o === 'sold') return holdGoal!.type === 'forever' ? 15 : 20;
        if (o === 'bought') return holdGoal!.type === 'forever' ? 60 : 50;
        return 50;
      });
      decisionScore = scores.reduce((s, v) => s + v, 0) / scores.length;
    }
  }

  // --- 4. Cognitive Reappraisal ---
  const reappraisalScores = recent.map((r) => {
    const engaged = r.counted_companion_count;
    const { pctAbs } = parseVolatility(r.context_snapshot);
    const volMult = pctAbs >= 3 ? 1.5 : 1;
    return Math.min(100, (Math.min(engaged, 4) / 4) * 100 * volMult);
  });
  const reappraisalScore =
    reappraisalScores.length > 0
      ? reappraisalScores.reduce((s, v) => s + v, 0) / reappraisalScores.length
      : 0;

  // --- 5. Self-Awareness ---
  const awarenessScores = recent.map((r) => {
    let depth = 0;
    const noteLen = (r.note_text ?? '').length;
    if (noteLen > 10) depth += 40;
    else if (noteLen > 0) depth += 20;
    if (r.tags && r.tags.length > 0) depth += 30;
    if (r.is_favorite) depth += 15;
    // Post-pause mood log (`shift_emotion_logged` / post) increases self-awareness depth in aggregates.
    if (hasPauseShiftOrPostEmotion(r)) depth += 15;
    return Math.min(100, depth);
  });
  const awarenessScore =
    awarenessScores.length > 0
      ? awarenessScores.reduce((s, v) => s + v, 0) / awarenessScores.length
      : 0;

  const score = Math.round(
    emotionalScore * wEmotional +
      distressScore * wDistress +
      decisionScore * wDecision +
      reappraisalScore * wReappraisal +
      awarenessScore * wAwareness,
  );

  // --- Trend ---
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recent.length >= 6) {
    const mid = Math.floor(recent.length / 2);
    const older = recent.slice(mid);
    const newer = recent.slice(0, mid);

    const avgComposure = (arr: typeof recent) => {
      const withMood = arr.filter((r) => {
        const m = effectivePauseShiftMood(r);
        return m && COMPOSURE[m];
      });
      if (withMood.length === 0) return 50;
      return (
        withMood.reduce((s, r) => s + (COMPOSURE[effectivePauseShiftMood(r)!] ?? 50), 0) / withMood.length
      );
    };

    const diff = avgComposure(newer) - avgComposure(older);
    if (diff > 10) trend = 'improving';
    else if (diff < -10) trend = 'declining';
  }

  // Touch companionEvents so unused-param is not flagged — they feed
  // future per-tool reappraisal lift in PerspectiveToolsImpactCard.
  void companionEvents;

  return {
    score: Math.max(0, Math.min(100, score)),
    emotionalRegulation: Math.round(emotionalScore),
    distressTolerance: Math.round(distressScore),
    decisionAlignment: Math.round(decisionScore),
    cognitiveReappraisal: Math.round(reappraisalScore),
    selfAwareness: Math.round(awarenessScore),
    trend,
    sampleSize: recent.length,
  };
}
