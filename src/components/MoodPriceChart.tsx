import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Props {
  reflections: { context: string | null; mood: string | null }[];
}

const MOOD_MAP: Record<string, number> = { anxious: 1, neutral: 2, calm: 3 };
const MOOD_LABELS: Record<number, string> = { 1: 'Anxious', 2: 'Neutral', 3: 'Calm' };
const MOOD_COLORS: Record<string, string> = {
  anxious: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
  calm: 'hsl(var(--primary))',
};

function extractChange(context: string | null): number | null {
  if (!context) return null;
  // Match patterns like "down 0.8%" or "up 4.7%"
  const match = context.match(/(up|down)\s+([\d.]+)%/i);
  if (!match) return null;
  const val = parseFloat(match[2]);
  return match[1].toLowerCase() === 'down' ? -val : val;
}

export function MoodPriceChart({ reflections }: Props) {
  const data = useMemo(() => {
    return reflections
      .filter((r) => r.mood && MOOD_MAP[r.mood] !== undefined && r.context)
      .map((r) => {
        const change = extractChange(r.context);
        if (change === null) return null;
        return { change, mood: MOOD_MAP[r.mood!], moodLabel: r.mood! };
      })
      .filter(Boolean) as { change: number; mood: number; moodLabel: string }[];
  }, [reflections]);

  // Compute averages per mood for the summary
  const moodAvgs = useMemo(() => {
    const groups: Record<string, { total: number; count: number }> = {};
    for (const d of data) {
      const g = groups[d.moodLabel] || { total: 0, count: 0 };
      g.total += d.change;
      g.count += 1;
      groups[d.moodLabel] = g;
    }
    return Object.entries(groups).map(([mood, { total, count }]) => ({
      mood,
      avg: total / count,
      count,
    }));
  }, [data]);

  if (data.length < 3) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
        Mood × Price Change
      </p>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="change"
              type="number"
              name="24h Change"
              unit="%"
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="mood"
              type="number"
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(v: number) => MOOD_LABELS[v] ?? ''}
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }}
              contentStyle={{
                background: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(_v: number, name: string, props: { payload: { change: number; moodLabel: string } }) => {
                if (name === 'mood') return [props.payload.moodLabel, 'Mood'];
                return [`${props.payload.change > 0 ? '+' : ''}${props.payload.change.toFixed(1)}%`, '24h Change'];
              }}
              labelFormatter={() => ''}
            />
            <Scatter data={data} fill="hsl(var(--primary))">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={MOOD_COLORS[entry.moodLabel] ?? 'hsl(var(--primary))'}
                  fillOpacity={0.7}
                  r={5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {(['anxious', 'neutral', 'calm'] as const).map((m) => {
          const entry = moodAvgs.find((e) => e.mood === m);
          if (!entry) return null;
          return (
            <div key={m} className="text-center space-y-0.5">
              <p className="text-[10px] font-mono text-muted-foreground capitalize">{m}</p>
              <p className="text-xs font-mono">
                {entry.avg > 0 ? '+' : ''}{entry.avg.toFixed(1)}%
              </p>
              <p className="text-[9px] text-muted-foreground/40">{entry.count} entries</p>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        How your mood correlates with BTC's 24h price change at the time of reflection
      </p>
    </div>
  );
}
