import { useMemo } from 'react';
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

const MOOD_VAL: Record<string, number> = { anxious: 1, neutral: 2, calm: 3 };
const MOOD_LABELS: Record<number, string> = { 1: 'Anxious', 2: 'Neutral', 3: 'Calm' };

export function MoodTrendChart({ reflections }: Props) {
  const data = useMemo(() => {
    const weeks = new Map<string, { total: number; count: number }>();

    for (const r of reflections) {
      if (!r.mood || MOOD_VAL[r.mood] === undefined) continue;
      const weekStart = startOfWeek(parseISO(r.created_at), { weekStartsOn: 1 });
      const key = weekStart.toISOString().slice(0, 10);
      const entry = weeks.get(key) || { total: 0, count: 0 };
      entry.total += MOOD_VAL[r.mood];
      entry.count += 1;
      weeks.set(key, entry);
    }

    return Array.from(weeks.entries())
      .map(([week, { total, count }]) => ({
        week,
        label: format(new Date(week), 'MMM d'),
        avg: total / count,
        count,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [reflections]);

  if (data.length < 2) return null;

  // Overall trend direction
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

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          Weekly Mood Trend
        </p>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${trendColor}`}>
          {trendLabel}
        </span>
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
              labelFormatter={(label: string) => `Week of ${label}`}
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
        Average mood per week across {data.reduce((s, d) => s + d.count, 0)} reflections
      </p>
    </div>
  );
}
