import { useMemo } from 'react';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Reflection {
  mood: string | null;
  outcome: string | null;
  breathing_completed: boolean;
  haiku_read: boolean;
  learning_read: boolean;
  created_at: string;
}

interface Props {
  reflections: Reflection[];
}

export function DecisionQualityCard({ reflections }: Props) {
  const data = useMemo(() => {
    const withOutcome = reflections.filter((r) => r.outcome);
    if (withOutcome.length < 3) return null;

    const engaged = withOutcome.filter(
      (r) => r.breathing_completed || r.haiku_read || r.learning_read
    );
    const notEngaged = withOutcome.filter(
      (r) => !r.breathing_completed && !r.haiku_read && !r.learning_read
    );

    const holdRate = (arr: typeof withOutcome) => {
      if (arr.length === 0) return null;
      return arr.filter((r) => r.outcome === 'held').length / arr.length;
    };

    const engagedHoldRate = holdRate(engaged);
    const notEngagedHoldRate = holdRate(notEngaged);

    // Overall decision quality: % of engaged reflections that led to holding
    const overallHoldRate = holdRate(withOutcome);

    // Trend: compare first half vs second half
    const sorted = [...withOutcome].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = holdRate(sorted.slice(0, mid));
    const secondHalf = holdRate(sorted.slice(mid));
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (firstHalf !== null && secondHalf !== null) {
      const delta = secondHalf - firstHalf;
      if (delta > 0.1) trend = 'improving';
      else if (delta < -0.1) trend = 'declining';
    }

    // Breathing impact specifically
    const breathed = withOutcome.filter((r) => r.breathing_completed);
    const breathedHoldRate = holdRate(breathed);

    return {
      totalDecisions: withOutcome.length,
      engagedCount: engaged.length,
      notEngagedCount: notEngaged.length,
      engagedHoldRate,
      notEngagedHoldRate,
      overallHoldRate,
      breathedHoldRate,
      breathedCount: breathed.length,
      trend,
      delta:
        engagedHoldRate !== null && notEngagedHoldRate !== null
          ? engagedHoldRate - notEngagedHoldRate
          : null,
    };
  }, [reflections]);

  if (!data) return null;

  const pct = (v: number | null) => (v !== null ? `${Math.round(v * 100)}%` : '—');

  const TrendIcon =
    data.trend === 'improving'
      ? TrendingUp
      : data.trend === 'declining'
        ? TrendingDown
        : Minus;

  const trendColor =
    data.trend === 'improving'
      ? 'text-green-500'
      : data.trend === 'declining'
        ? 'text-orange-400'
        : 'text-muted-foreground';

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Decision Quality
          </p>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span className="text-[10px] font-mono capitalize">{data.trend}</span>
        </div>
      </div>

      {/* Main insight */}
      {data.delta !== null && data.engagedCount >= 2 && data.notEngagedCount >= 2 ? (
        <div className="space-y-1">
          <p className="text-sm leading-relaxed">
            {data.delta > 0 ? (
              <>
                When you pause before acting, your hold rate is{' '}
                <span className="font-mono font-medium text-primary">
                  {Math.round(data.delta * 100)}pp higher
                </span>
                .
              </>
            ) : data.delta === 0 ? (
              <>Your hold rate is the same whether you pause or not — keep reflecting.</>
            ) : (
              <>
                Interesting — your hold rate is similar regardless of pausing. The practice may be
                helping in ways beyond outcomes.
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Keep reflecting to see how pausing affects your decisions.
        </p>
      )}

      {/* Bars */}
      <div className="space-y-2.5">
        <QualityBar
          label="With pause"
          value={data.engagedHoldRate}
          count={data.engagedCount}
        />
        <QualityBar
          label="Without pause"
          value={data.notEngagedHoldRate}
          count={data.notEngagedCount}
        />
        {data.breathedCount >= 2 && (
          <QualityBar
            label="After breathing"
            value={data.breathedHoldRate}
            count={data.breathedCount}
            accent
          />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/50 font-mono">
        Based on {data.totalDecisions} decisions with recorded outcomes
      </p>
    </div>
  );
}

function QualityBar({
  label,
  value,
  count,
  accent,
}: {
  label: string;
  value: number | null;
  count: number;
  accent?: boolean;
}) {
  const width = value !== null ? Math.round(value * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>
          {label}{' '}
          <span className="text-muted-foreground/40">({count})</span>
        </span>
        <span>{value !== null ? `${Math.round(value * 100)}% held` : '—'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            accent ? 'bg-primary' : 'bg-primary/60'
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
