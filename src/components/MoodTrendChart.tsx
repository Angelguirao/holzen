import { useMemo, useState } from 'react';
import { ChartEmptyState } from './ChartEmptyState';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, startOfWeek, parseISO } from 'date-fns';

interface Props {
  reflections: { created_at: string; mood: string | null }[];
}

type Granularity = 'daily' | 'weekly';

const MOOD_VAL: Record<string, number> = { anxious: 1, neutral: 2, calm: 3 };
const MOOD_LABELS: Record<number, string> = { 1: 'Anxious', 2: 'Neutral', 3: 'Calm' };

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
      label: format(new Date(key), granularity === 'daily' ? 'MMM d' : 'MMM d'),
      avg: total / count,
      count,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function MoodTrendChart({ reflections }: Props) {
  const [granularity, setGranularity] = useState<Granularity>('weekly');

  const data = useMemo(() => buildData(reflections, granularity), [reflections, granularity]);

  if (data.length < 1) {
    const moodCount = reflections.filter((r) => r.mood && MOOD_VAL[r.mood] !== undefined).length;
    return (
      <ChartEmptyState
        title="Mood Trend"
        message="Complete 2+ reflections with mood checks to see your trend."
        current={moodCount}
        needed={2}
      />
    );
  }

  const first = data[0].avg;
  const last = data[data.length - 1].avg;
  const diff = last - first;
  const trendLabel = Math.abs(diff) < 0.15 ? 'stable' : diff > 0 ? 'improving' : 'declining';
  const trendColor =
    trendLabel === 'improving'
      ? 'text-primary'
      : trendLabel === 'declining'
        ? 'text-destructive'
        : 'text-muted-foreground';

  const periodLabel = granularity === 'daily' ? 'day' : 'week';

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          Mood Trend
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
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(v: number) => MOOD_LABELS[v] ?? ''}
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={2} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(value: number) => {
                const closest = value < 1.5 ? 'Anxious' : value < 2.5 ? 'Neutral' : 'Calm';
                return [`${value.toFixed(2)} (${closest})`, 'Avg Mood'];
              }}
              labelFormatter={(label: string) =>
                granularity === 'daily' ? label : `Week of ${label}`
              }
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        Average mood per {periodLabel} across {data.reduce((s, d) => s + d.count, 0)} reflections
      </p>
    </div>
  );
}
