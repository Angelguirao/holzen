import { useMemo } from 'react';

interface Props {
  reflections: { context: string | null; mood: string | null }[];
}

const MOODS = ['calm', 'neutral', 'anxious'] as const;
const MOOD_LABELS: Record<string, string> = { anxious: 'Anxious', neutral: 'Neutral', calm: 'Calm' };

const BUCKETS = [
  { label: '< -5%', min: -Infinity, max: -5 },
  { label: '-5 to -2%', min: -5, max: -2 },
  { label: '-2 to 0%', min: -2, max: 0 },
  { label: '0 to +2%', min: 0, max: 2 },
  { label: '+2 to +5%', min: 2, max: 5 },
  { label: '> +5%', min: 5, max: Infinity },
];

function extractChange(context: string | null): number | null {
  if (!context) return null;
  const match = context.match(/(up|down)\s+([\d.]+)%/i);
  if (!match) return null;
  const val = parseFloat(match[2]);
  return match[1].toLowerCase() === 'down' ? -val : val;
}

function getBucketIndex(change: number): number {
  for (let i = 0; i < BUCKETS.length; i++) {
    if (change >= BUCKETS[i].min && change < BUCKETS[i].max) return i;
  }
  return BUCKETS.length - 1;
}

export function MoodPriceChart({ reflections }: Props) {
  const { grid, maxCount, totalPoints } = useMemo(() => {
    const points = reflections
      .filter((r) => r.mood && MOODS.includes(r.mood as any) && r.context)
      .map((r) => {
        const change = extractChange(r.context);
        if (change === null) return null;
        return { mood: r.mood!, change };
      })
      .filter(Boolean) as { mood: string; change: number }[];

    // Build grid[mood][bucketIndex] = count
    const grid: Record<string, number[]> = {};
    for (const m of MOODS) {
      grid[m] = new Array(BUCKETS.length).fill(0);
    }
    let maxCount = 0;
    for (const p of points) {
      const bi = getBucketIndex(p.change);
      grid[p.mood][bi]++;
      if (grid[p.mood][bi] > maxCount) maxCount = grid[p.mood][bi];
    }

    return { grid, maxCount, totalPoints: points.length };
  }, [reflections]);

  if (totalPoints < 3) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
        Mood × Price Change
      </p>

      <div className="space-y-0">
        {/* Column headers */}
        <div className="flex">
          <div className="w-16 shrink-0" />
          {BUCKETS.map((b, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[8px] font-mono text-muted-foreground/50 leading-none">
                {b.label}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {MOODS.map((mood) => (
          <div key={mood} className="flex items-center gap-0">
            <div className="w-16 shrink-0 pr-2 text-right">
              <span className="text-[9px] font-mono text-muted-foreground">
                {MOOD_LABELS[mood]}
              </span>
            </div>
            {BUCKETS.map((_, bi) => {
              const count = grid[mood][bi];
              const intensity = maxCount > 0 ? count / maxCount : 0;
              return (
                <div
                  key={bi}
                  className="flex-1 aspect-[2/1] m-[1px] rounded-sm flex items-center justify-center transition-colors relative group"
                  style={{
                    backgroundColor: count > 0
                      ? `hsl(var(--primary) / ${0.12 + intensity * 0.68})`
                      : 'hsl(var(--muted) / 0.3)',
                  }}
                >
                  {count > 0 && (
                    <span
                      className="text-[9px] font-mono"
                      style={{
                        color: intensity > 0.5
                          ? 'hsl(var(--primary-foreground))'
                          : 'hsl(var(--primary))',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }} />
            <span className="text-[8px] font-mono text-muted-foreground/40">0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary) / 0.3)' }} />
            <span className="text-[8px] font-mono text-muted-foreground/40">few</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary) / 0.8)' }} />
            <span className="text-[8px] font-mono text-muted-foreground/40">many</span>
          </div>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/40">{totalPoints} entries</span>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        How often each mood appears at different price changes
      </p>
    </div>
  );
}
