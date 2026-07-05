/** Keys returned by `get_practice_summary.xp_by_signal` (Postgres). */
export const PRACTICE_XP_SIGNAL_KEYS = [
  'base_brief',
  'base_deep',
  'favorite',
  'note',
  'companions',
  'companion_favorites',
  'breath_second',
  'shift_mood',
  'post_pause_check_in',
] as const;

export type PracticeXpSignalKey = (typeof PRACTICE_XP_SIGNAL_KEYS)[number];

export type PracticeXpBySignal = Record<PracticeXpSignalKey, number>;

export const EMPTY_PRACTICE_XP_BY_SIGNAL: PracticeXpBySignal = {
  base_brief: 0,
  base_deep: 0,
  favorite: 0,
  note: 0,
  companions: 0,
  companion_favorites: 0,
  breath_second: 0,
  shift_mood: 0,
  post_pause_check_in: 0,
};

export function mapPracticeXpBySignalRpc(raw: unknown): PracticeXpBySignal {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PRACTICE_XP_BY_SIGNAL };
  const o = raw as Record<string, unknown>;
  const out = { ...EMPTY_PRACTICE_XP_BY_SIGNAL };
  for (const key of PRACTICE_XP_SIGNAL_KEYS) {
    out[key] = parseXp(o[key]);
  }
  return out;
}

function parseXp(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }
  return 0;
}

export function sumPracticeXpBySignal(signals: PracticeXpBySignal): number {
  return PRACTICE_XP_SIGNAL_KEYS.reduce((acc, key) => acc + signals[key], 0);
}

export type PracticeXpSignalRow = {
  key: PracticeXpSignalKey;
  xp: number;
  sharePercent: number;
};

/** Non-zero signals sorted by XP descending (for Journey breakdown bars). */
export function buildPracticeXpSignalRows(
  signals: PracticeXpBySignal,
  presenceXpTotal: number,
): PracticeXpSignalRow[] {
  const denominator = presenceXpTotal > 0 ? presenceXpTotal : sumPracticeXpBySignal(signals);
  const rows: PracticeXpSignalRow[] = [];

  for (const key of PRACTICE_XP_SIGNAL_KEYS) {
    const xp = signals[key];
    if (xp <= 0) continue;
    const sharePercent =
      denominator > 0 ? Math.min(100, Math.round((xp / denominator) * 100)) : 0;
    rows.push({ key, xp, sharePercent });
  }

  rows.sort((a, b) => b.xp - a.xp);
  return rows;
}
