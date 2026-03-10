import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  labelKey: string;
  min: number;
  max: number;
  composureAvg: number | null;
  holdRate: number | null;
  count: number;
}

export function VolatilityToleranceCard({ reflections }: Props) {
  const { t } = useTranslation();

  const data = useMemo(() => {
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

    const bucketDefs = [
      { labelKey: 'volatility.buckets.mild', min: 0, max: 3 },
      { labelKey: 'volatility.buckets.moderate', min: 3, max: 6 },
      { labelKey: 'volatility.buckets.heavy', min: 6, max: 100 },
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

    let gradeKey: string;
    let gradeColor: string;
    if (overallScore === null) {
      gradeKey = '';
      gradeColor = 'text-muted-foreground';
    } else if (overallScore >= 80) {
      gradeKey = 'volatility.grades.ironHands';
      gradeColor = 'text-primary';
    } else if (overallScore >= 60) {
      gradeKey = 'volatility.grades.steady';
      gradeColor = 'text-primary/70';
    } else if (overallScore >= 40) {
      gradeKey = 'volatility.grades.shaky';
      gradeColor = 'text-muted-foreground';
    } else {
      gradeKey = 'volatility.grades.paperHands';
      gradeColor = 'text-destructive';
    }

    let descKey: string;
    if (overallScore === null) descKey = '';
    else if (overallScore >= 80) descKey = 'volatility.descriptions.high';
    else if (overallScore >= 60) descKey = 'volatility.descriptions.moderate';
    else if (overallScore >= 40) descKey = 'volatility.descriptions.low';
    else descKey = 'volatility.descriptions.veryLow';

    return { buckets, overallScore, gradeKey, gradeColor, descKey, totalDrops: drops.length };
  }, [reflections]);

  if (!data) {
    const dropCount = reflections.filter((r) => {
      const change = extractChange(r.context);
      return change !== null && change < 0;
    }).length;
    return (
      <ChartEmptyState
        title={t('volatility.title')}
        message={t('volatility.emptyMessage')}
        current={dropCount}
        needed={3}
      />
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {t('volatility.title')}
          </p>
        </div>
        {data.overallScore !== null && data.gradeKey && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${data.gradeColor}`}>
            {t(data.gradeKey)}
          </span>
        )}
      </div>

      {data.overallScore !== null && (
        <div className="flex items-center gap-4">
          <ScoreRing score={data.overallScore} />
          <div className="space-y-1 flex-1 min-w-0">
            {data.descKey && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(data.descKey)}
              </p>
            )}
            <p className="text-[10px] font-mono text-muted-foreground/40">
              {t('volatility.basedOnDrops', { count: data.totalDrops })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {data.buckets.map((b) => (
          b.count > 0 && (
            <BucketRow key={b.labelKey} bucket={b} />
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
  const { t } = useTranslation();

  const composureLabel = bucket.composureAvg !== null
    ? bucket.composureAvg < 30 ? t('volatility.composure.reactive') : bucket.composureAvg < 60 ? t('volatility.composure.mixed') : t('volatility.composure.composed')
    : '—';

  const composureColor = bucket.composureAvg !== null
    ? bucket.composureAvg < 30 ? 'text-destructive' : bucket.composureAvg < 60 ? 'text-muted-foreground' : 'text-primary'
    : 'text-muted-foreground/40';

  return (
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-muted-foreground">
        {t(bucket.labelKey)}{' '}
        <span className="text-muted-foreground/40">
          ({bucket.min}–{bucket.max >= 100 ? '∞' : bucket.max}%)
        </span>
      </span>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground/40">{bucket.count}×</span>
        <span className={composureColor}>{composureLabel}</span>
        {bucket.holdRate !== null && (
          <span className="text-muted-foreground/50">{t('volatility.held', { percent: Math.round(bucket.holdRate * 100) })}</span>
        )}
      </div>
    </div>
  );
}
