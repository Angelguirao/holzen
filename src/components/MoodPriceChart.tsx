import { useMemo } from 'react';

interface Props {
  reflections: { context: string | null; mood: string | null }[];
}

const MOODS = ['anxious', 'neutral', 'calm'] as const;
const MOOD_LABELS: Record<string, string> = { anxious: 'Anxious', neutral: 'Neutral', calm: 'Calm' };
const MOOD_VALUES: Record<string, number> = { anxious: 1, neutral: 2, calm: 3 };

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
  const { moodAvgs, r, rStrength, maxAbsAvg } = useMemo(() => {
    const points: { mood: string; change: number }[] = [];

    for (const ref of reflections) {
      if (!ref.mood || !MOOD_VALUES[ref.mood] || !ref.context) continue;
      const change = extractChange(ref.context);
      if (change === null) continue;
      points.push({ mood: ref.mood, change });
    }

    // Averages per mood
    const groups: Record<string, { total: number; count: number }> = {};
    for (const p of points) {
      const g = groups[p.mood] || { total: 0, count: 0 };
      g.total += p.change;
      g.count += 1;
      groups[p.mood] = g;
    }

    const moodAvgs = MOODS.map((m) => ({
      mood: m,
      label: MOOD_LABELS[m],
      avg: groups[m] ? groups[m].total / groups[m].count : null,
      count: groups[m]?.count ?? 0,
    })).filter((m) => m.avg !== null) as { mood: string; label: string; avg: number; count: number }[];

    const maxAbsAvg = Math.max(...moodAvgs.map((m) => Math.abs(m.avg)), 1);

    // Correlation
    const r = pearsonR(points.map((p) => ({ x: p.change, y: MOOD_VALUES[p.mood] })));
    const rStrength = r !== null
      ? Math.abs(r) < 0.3 ? 'weak' : Math.abs(r) < 0.6 ? 'moderate' : 'strong'
      : null;

    return { moodAvgs, r, rStrength, maxAbsAvg };
  }, [reflections]);

  if (moodAvgs.length < 2) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          Mood × Price Change
        </p>
        {r !== null && (
          <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded">
            r = {r >= 0 ? '+' : ''}{r.toFixed(2)} · {rStrength}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {moodAvgs.map((m) => {
          const isNeg = m.avg < 0;
          const barWidth = (Math.abs(m.avg) / maxAbsAvg) * 50; // 50% max width per side

          return (
            <div key={m.mood} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">{m.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">{m.count} entries</span>
              </div>
              <div className="relative h-5 w-full flex items-center">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60" />

                {/* Bar */}
                <div
                  className="absolute h-4 rounded-sm transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    ...(isNeg
                      ? { right: '50%', backgroundColor: 'hsl(var(--destructive) / 0.6)' }
                      : { left: '50%', backgroundColor: 'hsl(var(--primary) / 0.6)' }),
                  }}
                />

                {/* Value label */}
                <div
                  className="absolute text-[10px] font-mono"
                  style={{
                    ...(isNeg
                      ? { right: `calc(50% + ${barWidth}% + 6px)`, color: 'hsl(var(--destructive))' }
                      : { left: `calc(50% + ${barWidth}% + 6px)`, color: 'hsl(var(--primary))' }),
                  }}
                >
                  {isNeg ? '' : '+'}{m.avg.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis labels */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono text-muted-foreground/40">← drops</span>
        <span className="text-[8px] font-mono text-muted-foreground/40">0%</span>
        <span className="text-[8px] font-mono text-muted-foreground/40">surges →</span>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        Average BTC 24h change when each mood was logged
      </p>
    </div>
  );
}
