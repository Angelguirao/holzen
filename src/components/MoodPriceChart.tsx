import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartEmptyState } from './ChartEmptyState';

const MOOD_COLORS: Record<string, { bar: string; text: string }> = {
  fomo: { bar: 'hsl(var(--destructive) / 0.5)', text: 'hsl(var(--destructive))' },
  greedy: { bar: 'hsl(var(--destructive) / 0.4)', text: 'hsl(var(--destructive))' },
  anxious: { bar: 'hsl(var(--destructive) / 0.35)', text: 'hsl(var(--destructive) / 0.8)' },
  fearful: { bar: 'hsl(var(--destructive) / 0.3)', text: 'hsl(var(--destructive) / 0.7)' },
  excited: { bar: 'hsl(var(--accent) / 0.4)', text: 'hsl(var(--accent-foreground))' },
  uncertain: { bar: 'hsl(var(--muted-foreground) / 0.3)', text: 'hsl(var(--muted-foreground))' },
  detached: { bar: 'hsl(var(--muted-foreground) / 0.25)', text: 'hsl(var(--muted-foreground) / 0.8)' },
  calm: { bar: 'hsl(var(--primary) / 0.5)', text: 'hsl(var(--primary))' },
};

interface Props {
  reflections: { context: string | null; mood: string | null }[];
}

const MOODS = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const;
const MOOD_VALUES: Record<string, number> = {
  fomo: 1, greedy: 1.5, anxious: 2, fearful: 2, excited: 2.5,
  uncertain: 3, detached: 4, calm: 5,
};

function extractChange(context: string | null): number | null {
  if (!context) return null;
  const match = context.match(/(up|down)\s+([\d.]+)%/i);
  if (!match) return null;
  const val = parseFloat(match[2]);
  return match[1].toLowerCase() === 'down' ? -val : val;
}

function pearsonR(points: { x: number; y: number }[]): number | null {
  const n = points.length;
  if (n < 3) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denom === 0) return null;
  return (n * sumXY - sumX * sumY) / denom;
}

export function MoodPriceChart({ reflections }: Props) {
  const { t } = useTranslation();

  const { moodAvgs, r, rStrength, maxAbsAvg } = useMemo(() => {
    const points: { mood: string; change: number }[] = [];

    for (const ref of reflections) {
      if (!ref.mood || !MOOD_VALUES[ref.mood] || !ref.context) continue;
      const change = extractChange(ref.context);
      if (change === null) continue;
      points.push({ mood: ref.mood, change });
    }

    const groups: Record<string, { total: number; count: number }> = {};
    for (const p of points) {
      const g = groups[p.mood] || { total: 0, count: 0 };
      g.total += p.change;
      g.count += 1;
      groups[p.mood] = g;
    }

    const moodAvgs = MOODS.map((m) => ({
      mood: m,
      avg: groups[m] ? groups[m].total / groups[m].count : null,
      count: groups[m]?.count ?? 0,
    })).filter((m) => m.avg !== null) as { mood: string; avg: number; count: number }[];

    const maxAbsAvg = Math.max(...moodAvgs.map((m) => Math.abs(m.avg)), 0.5);

    const r = pearsonR(points.map((p) => ({ x: p.change, y: MOOD_VALUES[p.mood] })));
    const rStrength = r !== null
      ? Math.abs(r) < 0.3 ? t('moodCharts.weak') : Math.abs(r) < 0.6 ? t('moodCharts.moderate') : t('moodCharts.strong')
      : null;

    return { moodAvgs, r, rStrength, maxAbsAvg };
  }, [reflections, t]);

  if (moodAvgs.length < 2) {
    const withBoth = reflections.filter((r) => r.mood && r.context).length;
    return (
      <ChartEmptyState
        title={t('moodCharts.moodPriceChange')}
        message={t('moodCharts.moodPriceChangeEmpty')}
        current={withBoth}
        needed={3}
      />
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          {t('moodCharts.moodPriceChange')}
        </p>
        {r !== null && (
          <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded">
            r = {r >= 0 ? '+' : ''}{r.toFixed(2)} · {rStrength}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {moodAvgs.map((m) => {
          const isNeg = m.avg < 0;
          const barWidthPercent = (Math.abs(m.avg) / maxAbsAvg) * 100;
          const formattedAvg = `${isNeg ? '' : '+'}${m.avg.toFixed(1)}%`;

          return (
            <div key={m.mood} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{t(`moodCheck.moods.${m.mood}`, m.mood)}</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {t('moodCharts.entries', { count: m.count })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-6 bg-muted/40 rounded-sm overflow-hidden relative">
                  <div
                    className="absolute top-0 left-0 h-full rounded-sm transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(barWidthPercent, 4)}%`,
                      backgroundColor: MOOD_COLORS[m.mood]?.bar ?? 'hsl(var(--muted-foreground) / 0.3)',
                    }}
                  />
                </div>
                <span
                  className="text-xs font-mono font-medium w-14 text-right shrink-0"
                  style={{
                    color: MOOD_COLORS[m.mood]?.text ?? 'hsl(var(--muted-foreground))',
                  }}
                >
                  {formattedAvg}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        {t('moodCharts.avgBtcChange')}
      </p>
    </div>
  );
}
