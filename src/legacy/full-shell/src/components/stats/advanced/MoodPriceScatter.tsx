import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import type { PauseFullRow } from '@/legacy/full-shell/src/lib/pause-stats-data-query';

const MOOD_VALUE: Record<string, number> = {
  calm: 5, detached: 4, uncertain: 3, excited: 3,
  anxious: 2, fearful: 2, greedy: 1, fomo: 1,
};

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * Advanced: scatter of (BTC 24h change %, initial mood score 1-5).
 */
export function MoodPriceScatter({ rows }: Props) {
  const { t } = useTranslation();

  const points = useMemo(() => {
    return rows
      .map((r) => {
        const pct = Number(r.context_snapshot?.change_24h_pct);
        if (!r.initial_mood || !Number.isFinite(pct)) return null;
        const mood = MOOD_VALUE[r.initial_mood];
        if (!mood) return null;
        return { x: pct, y: mood };
      })
      .filter((p): p is { x: number; y: number } => p !== null);
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <p className="pb-3 text-xs font-semibold uppercase tracking-widest text-foreground">
        {t('stats.advanced.scatter.title', { defaultValue: 'Mood × BTC scatter' })}
      </p>
      {points.length < 8 ? (
        <p className="py-4 text-xs italic text-muted-foreground">
          {t('stats.advanced.scatter.empty', {
            defaultValue: 'Need at least 8 pauses with both mood + BTC context to plot.',
          })}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <XAxis type="number" dataKey="x" name="BTC %" tick={{ fontSize: 10 }} />
            <YAxis type="number" dataKey="y" domain={[1, 5]} name="Mood" tick={{ fontSize: 10 }} />
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <ReferenceLine y={3} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 11 }} />
            <Scatter data={points} fill="hsl(var(--primary))" />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
