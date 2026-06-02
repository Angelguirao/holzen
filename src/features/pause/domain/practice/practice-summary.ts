/** Client shape for `get_practice_summary` RPC (Postgres-maintained roll-ups). */
export type PracticeSummary = {
  completedPauseCount: number;
  presenceXpTotal: number;
  completedBriefCount: number;
  completedDeepCount: number;
};

export const EMPTY_PRACTICE_SUMMARY: PracticeSummary = {
  completedPauseCount: 0,
  presenceXpTotal: 0,
  completedBriefCount: 0,
  completedDeepCount: 0,
};

export function mapPracticeSummaryRpc(row: unknown): PracticeSummary {
  if (!row || typeof row !== 'object') return EMPTY_PRACTICE_SUMMARY;
  const o = row as Record<string, unknown>;
  return {
    completedPauseCount: numberField(o, 'completed_pause_count'),
    presenceXpTotal: numberField(o, 'presence_xp_total'),
    completedBriefCount: numberField(o, 'completed_brief_count'),
    completedDeepCount: numberField(o, 'completed_deep_count'),
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
