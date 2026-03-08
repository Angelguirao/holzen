import { useMemo } from 'react';

interface ReflectionStats {
  mood: string | null;
  outcome: string | null;
}

interface Props {
  reflections: ReflectionStats[];
}

const MOOD_META: Record<string, { label: string; emoji: string; color: string; energy: 'high' | 'low' }> = {
  fomo: { label: 'FOMO', emoji: '🔥', color: 'bg-destructive/70', energy: 'high' },
  excited: { label: 'Excited', emoji: '⚡', color: 'bg-accent/50', energy: 'high' },
  greedy: { label: 'Greedy', emoji: '🤑', color: 'bg-destructive/60', energy: 'high' },
  anxious: { label: 'Anxious', emoji: '😰', color: 'bg-destructive/50', energy: 'high' },
  calm: { label: 'Calm', emoji: '🧘', color: 'bg-primary/70', energy: 'low' },
  detached: { label: 'Detached', emoji: '😶', color: 'bg-muted-foreground/40', energy: 'low' },
  uncertain: { label: 'Uncertain', emoji: '🤔', color: 'bg-muted-foreground/50', energy: 'low' },
  fearful: { label: 'Fearful', emoji: '😨', color: 'bg-destructive/40', energy: 'low' },
};

const MOOD_ORDER = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'];

const OUTCOME_COLORS: Record<string, string> = {
  held: 'bg-primary/70',
  sold: 'bg-destructive/70',
  bought: 'bg-chart-2',
  nothing: 'bg-muted-foreground/50',
};

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  if (count === 0) return null;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function InsightsPanel({ reflections }: Props) {
  const { moodCounts, outcomeCounts, totalMoods, totalOutcomes } = useMemo(() => {
    const moods: Record<string, number> = {};
    const outcomes: Record<string, number> = {};
    let tm = 0;
    let to = 0;

    for (const r of reflections) {
      if (r.mood) { moods[r.mood] = (moods[r.mood] || 0) + 1; tm++; }
      if (r.outcome) { outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1; to++; }
    }

    return { moodCounts: moods, outcomeCounts: outcomes, totalMoods: tm, totalOutcomes: to };
  }, [reflections]);

  if (totalMoods === 0 && totalOutcomes === 0) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-5">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Mood & Actions</p>

      {totalMoods > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground/70">How you felt before reflecting</p>
          {MOOD_ORDER.map((m) => {
            const meta = MOOD_META[m];
            if (!meta || !moodCounts[m]) return null;
            return (
              <Bar
                key={m}
                label={`${meta.emoji} ${meta.label}`}
                count={moodCounts[m]}
                total={totalMoods}
                color={meta.color}
              />
            );
          })}
        </div>
      )}

      {totalOutcomes > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground/70">What you did after</p>
          {(['held', 'nothing', 'bought', 'sold'] as const).map((o) => (
            <Bar key={o} label={o} count={outcomeCounts[o] || 0} total={totalOutcomes} color={OUTCOME_COLORS[o]} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        Based on {reflections.length} reflection{reflections.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}