import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartEmptyState } from './ChartEmptyState';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, startOfWeek, parseISO } from 'date-fns';

interface Props {
  reflections: { created_at: string; mood: string | null }[];
}

type Granularity = 'daily' | 'weekly';

const MOOD_VAL: Record<string, number> = {
  fomo: 1, greedy: 1.5, anxious: 2, fearful: 2, excited: 2.5,
  uncertain: 3, detached: 4, calm: 5,
};

function buildData(reflections: Props['reflections'], granularity: Granularity) {
  const buckets = new Map<string, { total: number; count: number }>();

  for (const r of reflections) {
    if (!r.mood || MOOD_VAL[r.mood] === undefined) continue;
    const date = parseISO(r.created_at);
    const key =
      granularity === 'daily'
        ? date.toISOString().slice(0, 10)
        : startOfWeek(date, { weekStartsOn: 1 }).toISOString().slice(0, 10);
    const entry = buckets.get(key) || { total: 0, count: 0 };
    entry.total += MOOD_VAL[r.mood];
    entry.count += 1;
    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .map(([key, { total, count }]) => ({
      key,
      label: format(new Date(key), 'MMM d'),
      avg: total / count,
      count,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function MoodTrendChart({ reflections }: Props) {
  const { t } = useTranslation();
  const [granularity, setGranularity] = useState<Granularity>('weekly');

  const MOOD_LABELS: Record<number, string> = {
    1: t('moodCharts.reactive'), 3: t('moodCharts.neutral'), 5: t('moodCharts.composed'),
  };

  const data = useMemo(() => buildData(reflections, granularity), [reflections, granularity]);

  const moodCount = reflections.filter(r => r.mood && MOOD_VAL[r.mood] !== undefined).length;

  if (data.length < 3) {
    return (
      <ChartEmptyState
        title={t('moodCharts.moodTrend')}
        message={t('moodCharts.moodTrendEmpty', 'Log moods across 3 separate weeks to see your trend. Emotional check-ins count too.')}
        current={moodCount}
        needed={3}
      />
    );
  }

  const first = data[0].avg;
  const last = data[data.length - 1].avg;
  const diff = last - first;
  const trendLabel = Math.abs(diff) < 0.15 ? t('moodCharts.stable') : diff > 0 ? t('moodCharts.improving') : t('moodCharts.declining');
  const trendColor =
    diff > 0.15
      ? 'text-primary'
      : diff < -0.15
        ? 'text-destructive'
        : 'text-muted-foreground';

  const periodLabel = granularity === 'daily' ? t('moodCharts.day') : t('moodCharts.week');

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          {t('moodCharts.moodTrend')}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex rounded bg-muted/50 p-0.5">
            {(['daily', 'weekly'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                  granularity === g
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                }`}
              >
                {g === 'daily' ? 'D' : 'W'}
              </button>
            ))}
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${trendColor}`}>
            {trendLabel}
          </span>
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0.5, 5.5]} ticks={[1, 3, 5]} tickFormatter={(v: number) => MOOD_LABELS[v] ?? ''} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <ReferenceLine y={3} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
              formatter={(value: number) => {
                const label = value < 2 ? t('moodCharts.reactive') : value < 3.5 ? t('moodCharts.mixed') : t('moodCharts.composed');
                return [`${value.toFixed(2)} (${label})`, t('moodCharts.avgComposure')];
              }}
              labelFormatter={(label: string) =>
                granularity === 'daily' ? label : `${t('moodCharts.weekOf')} ${label}`
              }
            />
            <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'hsl(var(--primary))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        {t('moodCharts.averageMoodPer', { period: periodLabel, count: data.reduce((s, d) => s + d.count, 0) })}
      </p>
    </div>
  );
}
