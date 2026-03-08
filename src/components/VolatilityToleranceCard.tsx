import { useMemo } from 'react';
import { Activity } from 'lucide-react';

interface Reflection {
  context: string | null;
  mood: string | null;
  outcome: string | null;
  created_at: string;
}

interface Props {
  reflections: Reflection[];
}

const COMPOSURE: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

function extractChange(context: string | null): number | null {
  if (!context) return null;
  const match = context.match(/(up|down)\s+([\d.]+)%/i);
  if (!match) return null;
  const val = parseFloat(match[2]);
  return match[1].toLowerCase() === 'down' ? -val : val;
}

interface DropBucket {
  label: string;
  min: number;
  max: number;
  composureAvg: number | null;
  holdRate: number | null;
  count: number;
}

export function VolatilityToleranceCard({ reflections }: Props) {
  const data = useMemo(() => {
    // Only look at drops
    const drops = reflections
      .filter((r) => {
        const change = extractChange(r.context);
        return change !== null && change < 0 && r.mood && COMPOSURE[r.mood] !== undefined;
      })
      .map((r) => ({
        change: Math.abs(extractChange(r.context)!),
        composure: COMPOSURE[r.mood!],
        held: r.outcome === 'held' || r.outcome === 'nothing',
        hasOutcome: !!r.outcome,
      }));

    if (drops.length < 3) return null;

    // Buckets: mild (0-3%), moderate (3-6%), heavy (6%+)
    const bucketDefs = [
      { label: 'Mild dips', min: 0, max: 3 },
      { label: 'Moderate drops', min: 3, max: 6 },
      { label: 'Heavy drops', min: 6, max: 100 },
    ];

    const buckets: DropBucket[] = bucketDefs.map((def) => {
      const items = drops.filter((d) => d.change >= def.min && d.change < def.max);
      const withOutcome = items.filter((d) => d.hasOutcome);
      return {
        ...def,
        count: items.length,
        composureAvg: items.length > 0
          ? items.reduce((s, d) => s + d.composure, 0) / items.length
          : null,
        holdRate: withOutcome.length > 0
          ? withOutcome.filter((d) => d.held).length / withOutcome.length
          : null,
      };
    });

    // Overall volatility tolerance score
    // Weighted by severity: heavier drops matter more
    const weights = [1, 2, 3];
    let totalWeight = 0;
    let weightedScore = 0;

    buckets.forEach((b, i) => {
      if (b.composureAvg !== null && b.count > 0) {
        const holdBonus = b.holdRate !== null ? b.holdRate * 20 : 0;
        const bucketScore = Math.min(100, b.composureAvg * 0.8 + holdBonus);
        weightedScore += bucketScore * weights[i] * b.count;
        totalWeight += weights[i] * b.count;
      }
    });

    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : null;

    // Grade
    let grade: string;
    let gradeColor: string;
    if (overallScore === null) {
      grade = '—';
      gradeColor = 'text-muted-foreground';
    } else if (overallScore >= 80) {
      grade = 'Iron hands';
      gradeColor = 'text-primary';
    } else if (overallScore >= 60) {
      grade = 'Steady';
      gradeColor = 'text-primary/70';
    } else if (overallScore >= 40) {
      grade = 'Shaky';
      gradeColor = 'text-muted-foreground';
    } else {
      grade = 'Paper hands';
      gradeColor = 'text-destructive';
    }

    return { buckets, overallScore, grade, gradeColor, totalDrops: drops.length };
  }, [reflections]);

  if (!data) return null;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Volatility Tolerance
          </p>
        </div>
        {data.overallScore !== null && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${data.gradeColor}`}>
            {data.grade}
          </span>
        )}
      </div>

      {/* Score ring */}
      {data.overallScore !== null && (
        <div className="flex items-center gap-4">
          <ScoreRing score={data.overallScore} />
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.overallScore >= 80
                ? 'You stay remarkably composed during drops — even heavy ones.'
                : data.overallScore >= 60
                  ? 'You handle most drops well, though bigger swings test your composure.'
                  : data.overallScore >= 40
                    ? 'Drops tend to rattle you. Breathing before acting could help.'
                    : 'Drops hit hard emotionally. The ritual is your best defense.'}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/40">
              Based on {data.totalDrops} drop reflection{data.totalDrops !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Severity breakdown */}
      <div className="space-y-2">
        {data.buckets.map((b) => (
          b.count > 0 && (
            <BucketRow key={b.label} bucket={b} />
          )
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="3" opacity="0.3" />
        <circle
          cx="34" cy="34" r="28" fill="none"
          stroke={score >= 60 ? 'hsl(var(--primary))' : score >= 40 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--destructive))'}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 34 34)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-mono font-medium">{score}</span>
      </div>
    </div>
  );
}

function BucketRow({ bucket }: { bucket: DropBucket }) {
  const composureLabel = bucket.composureAvg !== null
    ? bucket.composureAvg < 30 ? 'Reactive' : bucket.composureAvg < 60 ? 'Mixed' : 'Composed'
    : '—';

  const composureColor = bucket.composureAvg !== null
    ? bucket.composureAvg < 30 ? 'text-destructive' : bucket.composureAvg < 60 ? 'text-muted-foreground' : 'text-primary'
    : 'text-muted-foreground/40';

  return (
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-muted-foreground">
        {bucket.label}{' '}
        <span className="text-muted-foreground/40">
          ({bucket.min}–{bucket.max >= 100 ? '∞' : bucket.max}%)
        </span>
      </span>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground/40">{bucket.count}×</span>
        <span className={composureColor}>{composureLabel}</span>
        {bucket.holdRate !== null && (
          <span className="text-muted-foreground/50">{Math.round(bucket.holdRate * 100)}% held</span>
        )}
      </div>
    </div>
  );
}