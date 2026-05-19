import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PauseFullRow } from '@/legacy/full-shell/src/lib/pause-stats-data-query';

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * Advanced: average BTC 24h change per initial mood.
 */
export function MoodPriceChart({ rows }: Props) {
  const { t } = useTranslation();

  const grouped = useMemo(() => {
    const byMood = new Map<string, { sum: number; n: number }>();
    for (const r of rows) {
      if (!r.initial_mood) continue;
      const pct = Number(r.context_snapshot?.change_24h_pct);
      if (!Number.isFinite(pct)) continue;
      const e = byMood.get(r.initial_mood) ?? { sum: 0, n: 0 };
      e.sum += pct;
      e.n += 1;
      byMood.set(r.initial_mood, e);
    }
    return Array.from(byMood.entries())
      .filter(([, e]) => e.n >= 2)
      .map(([mood, e]) => ({ mood, avg: e.sum / e.n, n: e.n }))
      .sort((a, b) => a.avg - b.avg);
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <p className="pb-3 text-xs font-semibold uppercase tracking-widest text-foreground">
        {t('stats.advanced.moodPrice.title', { defaultValue: 'Mood × BTC change' })}
      </p>
      {grouped.length < 2 ? (
        <p className="py-4 text-xs italic text-muted-foreground">
          {t('stats.advanced.moodPrice.empty', {
            defaultValue: 'Not enough mood + BTC data yet (need ≥ 2 pauses per mood).',
          })}
        </p>
      ) : (
        <div className="space-y-1.5">
          {grouped.map((row) => (
            <div key={row.mood} className="flex items-center justify-between text-xs">
              <span className="capitalize text-muted-foreground">{row.mood}</span>
              <span className="tabular-nums font-mono">
                {row.avg >= 0 ? '+' : ''}
                {row.avg.toFixed(1)}%
                <span className="ml-1 text-[10px] text-muted-foreground/60">({row.n})</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
