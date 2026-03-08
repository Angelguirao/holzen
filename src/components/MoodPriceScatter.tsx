import { useMemo, forwardRef } from 'react';
import { ChartEmptyState } from './ChartEmptyState';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface Props {
  reflections: { context: string | null; mood: string | null; created_at: string }[];
}

const MOOD_VAL: Record<string, number> = {
  fomo: 1, greedy: 1.5, anxious: 2, fearful: 2, excited: 2.5,
  uncertain: 3, detached: 4, calm: 5,
};
const MOOD_LABELS: Record<number, string> = { 1: 'Reactive', 3: 'Neutral', 5: 'Composed' };

const MOOD_COLORS: Record<string, string> = {
  fomo: 'hsl(var(--destructive))',
  greedy: 'hsl(var(--destructive) / 0.8)',
  anxious: 'hsl(var(--destructive) / 0.6)',
  fearful: 'hsl(var(--destructive) / 0.5)',
  excited: 'hsl(var(--accent-foreground))',
  uncertain: 'hsl(var(--muted-foreground))',
  detached: 'hsl(var(--muted-foreground) / 0.7)',
  calm: 'hsl(var(--primary))',
};

function extractChange(context: string | null): number | null {
  if (!context) return null;
  const match = context.match(/(up|down)\s+([\d.]+)%/i);
  if (!match) return null;
  const val = parseFloat(match[2]);
  return match[1].toLowerCase() === 'down' ? -val : val;
}

export const MoodPriceScatter = forwardRef<HTMLDivElement, Props>(function MoodPriceScatter({ reflections }, ref) {
  const points = useMemo(() => {
    const pts: { x: number; y: number; mood: string; date: string }[] = [];
    for (const r of reflections) {
      if (!r.mood || !MOOD_VAL[r.mood]) continue;
      const change = extractChange(r.context);
      if (change === null) continue;
      pts.push({
        x: change,
        y: MOOD_VAL[r.mood],
        mood: r.mood,
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    return pts;
  }, [reflections]);

  // Cluster summary
  const clusters = useMemo(() => {
    const neg = points.filter((p) => p.x < 0);
    const pos = points.filter((p) => p.x > 0);
    const avgMood = (pts: typeof points) =>
      pts.length ? pts.reduce((s, p) => s + p.y, 0) / pts.length : 0;
    return { neg: neg.length, pos: pos.length, negAvg: avgMood(neg), posAvg: avgMood(pos) };
  }, [points]);

  if (points.length < 8) {
    return (
      <ChartEmptyState
        title="Mood × Price Scatter"
        message="Need 8+ reflections with mood & price data to reveal emotional patterns."
        current={points.length}
        needed={8}
      />
    );
  }

  const xMax = Math.max(...points.map((p) => Math.abs(p.x)), 2) * 1.15;

  const insightParts: string[] = [];
  if (clusters.neg >= 3 && clusters.pos >= 3) {
    const toLabel = (avg: number) => avg < 2 ? 'reactive' : avg < 3.5 ? 'mixed' : 'composed';
    const negLabel = toLabel(clusters.negAvg);
    const posLabel = toLabel(clusters.posAvg);
    if (negLabel !== posLabel) {
      insightParts.push(`You tend to feel ${negLabel} during drops and ${posLabel} during surges.`);
    } else {
      insightParts.push(`You tend to feel ${negLabel} regardless of direction.`);
    }
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
        Mood × Price Scatter
      </p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[-xMax, xMax]}
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
              name="BTC Change"
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0.5, 5.5]}
              ticks={[1, 3, 5]}
              tickFormatter={(v: number) => MOOD_LABELS[v] ?? ''}
              tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              name="Mood"
            />
            <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={3} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3} />
            <Tooltip
              cursor={false}
              contentStyle={{
                background: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(_: any, name: string, entry: any) => {
                if (name === 'BTC Change') return [`${entry.payload.x > 0 ? '+' : ''}${entry.payload.x.toFixed(1)}%`, 'BTC'];
                if (name === 'Mood') return [MOOD_LABELS[entry.payload.y], 'Mood'];
                return [_, name];
              }}
              labelFormatter={() => ''}
            />
            <Scatter data={points} name="Reflections">
              {points.map((p, i) => (
                <Cell
                  key={i}
                  fill={MOOD_COLORS[p.mood] ?? 'hsl(var(--muted-foreground))'}
                  fillOpacity={0.6}
                  r={4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {insightParts.length > 0 && (
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
          {insightParts.join(' ')}
        </p>
      )}

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        Each dot is one reflection · {points.length} data points
      </p>
    </div>
  );
}
