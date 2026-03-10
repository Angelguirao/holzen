import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartEmptyState } from './ChartEmptyState';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { startOfWeek, parseISO, format } from 'date-fns';

const MOOD_SCORES: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

interface Reflection {
  created_at: string;
  mood: string | null;
  mood_after: string | null;
}

interface WeekDelta {
  key: string;
  label: string;
  before: number;
  after: number;
  delta: number;
  count: number;
}

function buildWeeklyDeltas(reflections: Reflection[]): WeekDelta[] {
  const buckets = new Map<string, { befores: number[]; afters: number[] }>();

  for (const r of reflections) {
    if (!r.mood || !r.mood_after || MOOD_SCORES[r.mood] === undefined || MOOD_SCORES[r.mood_after] === undefined) continue;
    const key = startOfWeek(parseISO(r.created_at), { weekStartsOn: 1 }).toISOString().slice(0, 10);
    const entry = buckets.get(key) || { befores: [], afters: [] };
    entry.befores.push(MOOD_SCORES[r.mood]);
    entry.afters.push(MOOD_SCORES[r.mood_after]);
    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .map(([key, b]) => {
      const before = Math.round(b.befores.reduce((s, v) => s + v, 0) / b.befores.length);
      const after = Math.round(b.afters.reduce((s, v) => s + v, 0) / b.afters.length);
      return {
        key,
        label: format(new Date(key), 'MMM d'),
        before,
        after,
        delta: after - before,
        count: b.befores.length,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

const tooltipStyle = {
  background: 'hsl(var(--muted))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: '11px',
  fontFamily: 'monospace',
};

interface Props {
  reflections: Reflection[];
}

export function MoodShiftChart({ reflections }: Props) {
  const { t } = useTranslation();
  const data = useMemo(() => buildWeeklyDeltas(reflections), [reflections]);

  const totalWithDelta = reflections.filter(
    r => r.mood && r.mood_after && MOOD_SCORES[r.mood] !== undefined && MOOD_SCORES[r.mood_after] !== undefined
  ).length;

  if (data.length < 2) {
    return (
      <ChartEmptyState
        title={t('statsTrends.moodShift', 'Grounding Effect')}
        message={t('statsTrends.moodShiftEmpty', 'Complete sessions with both mood checks across 2 weeks to see how grounding shifts your composure.')}
        current={data.length}
        needed={2}
      />
    );
  }

  const avgDelta = Math.round(data.reduce((s, d) => s + d.delta, 0) / data.length);
  const lastDelta = data[data.length - 1].delta;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          {t('statsTrends.moodShift', 'Grounding Effect')}
        </p>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${
          avgDelta > 0 ? 'text-primary' : avgDelta < 0 ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {avgDelta > 0 ? `+${avgDelta}` : `${avgDelta}`} {t('statsTrends.avgShift', 'avg shift')}
        </span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="deltaPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => {
                if (name === 'delta') return [`${value > 0 ? '+' : ''}${value}`, t('statsTrends.shift', 'Shift')];
                return [value, name];
              }}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="delta"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#deltaPositive)"
              dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              baseValue={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground/40">
        <span>
          {t('statsTrends.moodShiftDescription', 'Before → after composure shift per week. Positive = grounding helped.')}
        </span>
        <span className="font-mono">
          {totalWithDelta} {t('statsTrends.sessions', 'sessions')}
        </span>
      </div>
    </div>
  );
}
