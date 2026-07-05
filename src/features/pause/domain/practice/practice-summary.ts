/** Client shape for `get_practice_summary` RPC (Postgres-maintained roll-ups). */
import {
  EMPTY_PRACTICE_XP_BY_SIGNAL,
  mapPracticeXpBySignalRpc,
  type PracticeXpBySignal,
} from '@/features/pause/domain/practice/practice-xp-by-signal';

export type { PracticeXpBySignal, PracticeXpSignalKey } from '@/features/pause/domain/practice/practice-xp-by-signal';
export {
  buildPracticeXpSignalRows,
  PRACTICE_XP_SIGNAL_KEYS,
  sumPracticeXpBySignal,
} from '@/features/pause/domain/practice/practice-xp-by-signal';

export type PracticeSummary = {
  completedPauseCount: number;
  presenceXpTotal: number;
  completedBriefCount: number;
  completedDeepCount: number;
  xpBySignal: PracticeXpBySignal;
};

export const EMPTY_PRACTICE_SUMMARY: PracticeSummary = {
  completedPauseCount: 0,
  presenceXpTotal: 0,
  completedBriefCount: 0,
  completedDeepCount: 0,
  xpBySignal: EMPTY_PRACTICE_XP_BY_SIGNAL,
};

export function mapPracticeSummaryRpc(row: unknown): PracticeSummary {
  if (!row || typeof row !== 'object') return EMPTY_PRACTICE_SUMMARY;
  const o = row as Record<string, unknown>;
  return {
    completedPauseCount: numberField(o, 'completed_pause_count'),
    presenceXpTotal: numberField(o, 'presence_xp_total'),
    completedBriefCount: numberField(o, 'completed_brief_count'),
    completedDeepCount: numberField(o, 'completed_deep_count'),
    xpBySignal: mapPracticeXpBySignalRpc(o.xp_by_signal),
  };
}

function numberField(o: Record<string, unknown>, key: string): number {
  const v = o[key];
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }
  return 0;
}

/** Home tiles still use `presenceXp` naming. */
export function practiceSummaryToHomeStats(summary: PracticeSummary): {
  completedPauseCount: number;
  presenceXp: number;
} {
  return {
    completedPauseCount: summary.completedPauseCount,
    presenceXp: summary.presenceXpTotal,
  };
}
