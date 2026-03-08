import { useMemo } from 'react';
import { ChartEmptyState } from './ChartEmptyState';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { startOfWeek, parseISO, format } from 'date-fns';

interface Reflection {
  created_at: string;
  mood: string | null;
  outcome: string | null;
}

// Composure scale: higher = more composed
const MOOD_SCORES: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};
const OUTCOME_SCORES: Record<string, number> = { held: 100, nothing: 100, bought: 50, sold: 20 };

interface WeekBucket {
  key: string;
  label: string;
  score: number;
  moodAvg: number;
  outcomeAvg: number;
  holdRate: number;
  reactive: number;
  mixed: number;
  composed: number;
  count: number;
}

function buildWeeklyData(reflections: Reflection[]): WeekBucket[] {
  const buckets = new Map<string, {
    moods: number[]; outcomes: number[];
    reactive: number; mixed: number; composed: number;
    held: number; totalOutcomes: number; count: number;
  }>();

  for (const r of reflections) {
    const date = parseISO(r.created_at);
    const key = startOfWeek(date, { weekStartsOn: 1 }).toISOString().slice(0, 10);
    const entry = buckets.get(key) || {
      moods: [], outcomes: [],
      reactive: 0, mixed: 0, composed: 0,
      held: 0, totalOutcomes: 0, count: 0,
    };

    entry.count++;

    if (r.mood && MOOD_SCORES[r.mood] !== undefined) {
      const score = MOOD_SCORES[r.mood];
      entry.moods.push(score);
      if (score <= 30) entry.reactive++;
      else if (score <= 60) entry.mixed++;
      else entry.composed++;
    }

    if (r.outcome && OUTCOME_SCORES[r.outcome] !== undefined) {
      entry.outcomes.push(OUTCOME_SCORES[r.outcome]);
      entry.totalOutcomes++;
      if (r.outcome === 'held' || r.outcome === 'nothing') entry.held++;
    }

    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .map(([key, b]) => {
      const moodAvg = b.moods.length > 0 ? b.moods.reduce((a, c) => a + c, 0) / b.moods.length : 60;
      const outcomeAvg = b.outcomes.length > 0 ? b.outcomes.reduce((a, c) => a + c, 0) / b.outcomes.length : 50;
      const score = Math.round(moodAvg * 0.4 + outcomeAvg * 0.35 + 50 * 0.25);
      const totalMoods = b.reactive + b.mixed + b.composed;
      const holdRate = b.totalOutcomes > 0 ? Math.round((b.held / b.totalOutcomes) * 100) : 0;

      return {
        key,
        label: format(new Date(key), 'MMM d'),
        score: Math.max(0, Math.min(100, score)),
        moodAvg: Math.round(moodAvg),
        outcomeAvg: Math.round(outcomeAvg),
        holdRate,
        reactive: totalMoods > 0 ? Math.round((b.reactive / totalMoods) * 100) : 0,
        mixed: totalMoods > 0 ? Math.round((b.mixed / totalMoods) * 100) : 0,
        composed: totalMoods > 0 ? Math.round((b.composed / totalMoods) * 100) : 0,
        count: b.count,
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

export function StatsTrends({ reflections }: Props) {
  const data = useMemo(() => buildWeeklyData(reflections), [reflections]);

  if (data.length < 1) {
    return (
      <ChartEmptyState
        title="Weekly Trends"
        message="Complete 3+ reflections across different weeks to see score, mood, and hold-rate trends."
        current={reflections.length}
        needed={3}
      />
    );
  }

  const firstScore = data[0].score;
  const lastScore = data[data.length - 1].score;
  const scoreDelta = lastScore - firstScore;
  const scoreDirection = Math.abs(scoreDelta) < 3 ? 'stable' : scoreDelta > 0 ? 'up' : 'down';

  const firstHold = data[0].holdRate;
  const lastHold = data[data.length - 1].holdRate;
  const holdDelta = lastHold - firstHold;

  return (
    <div className="space-y-5">
      {/* Holzen Score over time */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Score Over Time
          </p>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${
            scoreDirection === 'up' ? 'text-primary' : scoreDirection === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {scoreDirection === 'up' ? `+${scoreDelta}` : scoreDirection === 'down' ? `${scoreDelta}` : 'stable'}
          </span>
        </div>
        <div className="h-36">
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
                domain={[0, 100]}
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}`, 'Score']} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground/40">
          Weekly composure score across {data.reduce((s, d) => s + d.count, 0)} reflections
        </p>
      </div>

      {/* Mood distribution shift */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          Mood Distribution
        </p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`${Math.round(v * 100)}%`, name]}
              />
              <Area type="monotone" dataKey="composed" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
              <Area type="monotone" dataKey="mixed" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.2)" />
              <Area type="monotone" dataKey="reactive" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/50">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60" />Composed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" />Mixed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/40" />Reactive</span>
        </div>
      </div>

      {/* Hold rate over time */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Hold Rate
          </p>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${
            holdDelta > 5 ? 'text-primary' : holdDelta < -5 ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {holdDelta > 0 ? `+${holdDelta}%` : `${holdDelta}%`}
          </span>
        </div>
        <div className="h-36">
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
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Hold rate']} />
              <Line
                type="monotone"
                dataKey="holdRate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground/40">
          % of weeks where you held or did nothing after reflecting
        </p>
      </div>
    </div>
  );
}
