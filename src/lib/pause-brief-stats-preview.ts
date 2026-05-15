import type { HoldGoalProfile } from '@/lib/hold-goal-profile-query';
import type { PauseStatsQueryPayload } from '@/lib/pause-stats-data-query';
import { computePauseScore } from '@/lib/stats/pause-score';

const SKILL_KEYS = [
  'emotionalRegulation',
  'distressTolerance',
  'decisionAlignment',
  'cognitiveReappraisal',
  'selfAwareness',
] as const;

export type BriefSkillDeltaKey = (typeof SKILL_KEYS)[number];

export type BriefStatsPreview =
  | { status: 'first_pause'; compositeScore: number; sampleSize: number }
  | {
      status: 'delta';
      compositeDelta: number;
      /** Non-zero skill deltas, largest magnitude first. */
      skills: { key: BriefSkillDeltaKey; delta: number }[];
      sampleSize: number;
    };

export type BriefStatsPreviewComputeResult = BriefStatsPreview | { status: 'missing_instance_row' };

function holdGoalForScore(
  row: Pick<HoldGoalProfile, 'type' | 'targetMonths' | 'targetPrice' | 'start'> | null | undefined,
): { type: string | null; targetMonths: number | null; targetPrice: number | null; start: string | null } | null {
  if (!row) return null;
  return {
    type: row.type,
    targetMonths: row.targetMonths,
    targetPrice: row.targetPrice,
    start: row.start,
  };
}

/**
 * Compares Journey’s rolling `computePauseScore` aggregate with vs without the
 * just-completed pause (same last-30 completed window as Stats / Home tiles).
 */
export function computeBriefPauseStatsPreview(args: {
  payload: PauseStatsQueryPayload;
  holdGoal: Pick<HoldGoalProfile, 'type' | 'targetMonths' | 'targetPrice' | 'start'> | null | undefined;
  completedInstanceId: string;
}): BriefStatsPreviewComputeResult {
  const completed = args.payload.rows.filter((r) => r.state === 'completed');
  const hasRow = completed.some((r) => r.id === args.completedInstanceId);
  if (!hasRow) return { status: 'missing_instance_row' };

  const holdGoal = holdGoalForScore(args.holdGoal);
  const base = {
    stepEvents: args.payload.stepEvents,
    companionEvents: args.payload.companionEvents,
    holdGoal,
  };

  const after = computePauseScore({
    completedRows: completed,
    ...base,
  });
  if (!after) return { status: 'missing_instance_row' };

  const beforeRows = completed.filter((r) => r.id !== args.completedInstanceId);
  const before =
    beforeRows.length > 0
      ? computePauseScore({
          completedRows: beforeRows,
          ...base,
        })
      : null;

  if (!before) {
    return { status: 'first_pause', compositeScore: after.score, sampleSize: after.sampleSize };
  }

  const skills: { key: BriefSkillDeltaKey; delta: number }[] = [];
  for (const key of SKILL_KEYS) {
    const delta = after[key] - before[key];
    if (delta !== 0) skills.push({ key, delta });
  }
  skills.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    status: 'delta',
    compositeDelta: after.score - before.score,
    skills,
    sampleSize: after.sampleSize,
  };
}
