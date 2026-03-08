import { useMemo, useState } from 'react';
import { Shield, TrendingUp, TrendingDown, Minus, ChevronDown, Wind, BookOpen, Feather, Radio, Eye, History } from 'lucide-react';

interface Reflection {
  mood: string | null;
  outcome: string | null;
  breathing_completed: boolean;
  haiku_read: boolean;
  learning_read: boolean;
  signal_read?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
  created_at: string;
}

interface Props {
  reflections: Reflection[];
}

interface CompanionStat {
  label: string;
  icon: typeof Wind;
  used: number;
  holdRate: number | null;
}

export function DecisionQualityCard({ reflections }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const data = useMemo(() => {
    const withOutcome = reflections.filter((r) => r.outcome);
    if (withOutcome.length < 3) return null;

    const engaged = withOutcome.filter(
      (r) => r.breathing_completed || r.haiku_read || r.learning_read || r.signal_read || r.zoom_out_read || r.history_read
    );
    const notEngaged = withOutcome.filter(
      (r) => !r.breathing_completed && !r.haiku_read && !r.learning_read && !r.signal_read && !r.zoom_out_read && !r.history_read
    );

    const holdRate = (arr: typeof withOutcome) => {
      if (arr.length === 0) return null;
      return arr.filter((r) => r.outcome === 'held' || r.outcome === 'nothing').length / arr.length;
    };

    const engagedHoldRate = holdRate(engaged);
    const notEngagedHoldRate = holdRate(notEngaged);
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

    // Per-companion breakdown
    const companions: CompanionStat[] = [
      { label: 'Breathing', icon: Wind, used: withOutcome.filter((r) => r.breathing_completed).length, holdRate: holdRate(withOutcome.filter((r) => r.breathing_completed)) },
      { label: 'Haiku', icon: Feather, used: withOutcome.filter((r) => r.haiku_read).length, holdRate: holdRate(withOutcome.filter((r) => r.haiku_read)) },
      { label: 'Learning', icon: BookOpen, used: withOutcome.filter((r) => r.learning_read).length, holdRate: holdRate(withOutcome.filter((r) => r.learning_read)) },
      { label: 'Signal', icon: Radio, used: withOutcome.filter((r) => r.signal_read).length, holdRate: holdRate(withOutcome.filter((r) => r.signal_read)) },
      { label: 'Zoom Out', icon: Eye, used: withOutcome.filter((r) => r.zoom_out_read).length, holdRate: holdRate(withOutcome.filter((r) => r.zoom_out_read)) },
      { label: 'History', icon: History, used: withOutcome.filter((r) => r.history_read).length, holdRate: holdRate(withOutcome.filter((r) => r.history_read)) },
    ].filter((c) => c.used >= 2);

    // Sort by hold rate descending (best companions first)
    companions.sort((a, b) => (b.holdRate ?? 0) - (a.holdRate ?? 0));

    return {
      totalDecisions: withOutcome.length,
      engagedCount: engaged.length,
      notEngagedCount: notEngaged.length,
      engagedHoldRate,
      notEngagedHoldRate,
      overallHoldRate,
      trend,
      companions,
      delta:
        engagedHoldRate !== null && notEngagedHoldRate !== null
          ? engagedHoldRate - notEngagedHoldRate
          : null,
    };
  }, [reflections]);

  if (!data) return null;

  const TrendIcon =
    data.trend === 'improving'
      ? TrendingUp
      : data.trend === 'declining'
        ? TrendingDown
        : Minus;

  const trendColor =
    data.trend === 'improving'
      ? 'text-primary'
      : data.trend === 'declining'
        ? 'text-destructive'
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

      {/* Summary bars */}
      <div className="space-y-2.5">
        <QualityBar label="With pause" value={data.engagedHoldRate} count={data.engagedCount} />
        <QualityBar label="Without pause" value={data.notEngagedHoldRate} count={data.notEngagedCount} />
      </div>

      {/* Per-companion breakdown */}
      {data.companions.length >= 2 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            Companion breakdown
          </button>

          {showBreakdown && (
            <div className="space-y-2 pt-1 border-t border-border/30">
              {data.companions.map((c) => (
                <CompanionBar key={c.label} companion={c} baselineRate={data.notEngagedHoldRate} />
              ))}
              {data.companions.length > 0 && data.notEngagedHoldRate !== null && (
                <p className="text-[9px] text-muted-foreground/40 font-mono pt-1">
                  Compared to {Math.round(data.notEngagedHoldRate * 100)}% baseline (no companions)
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
}: {
  label: string;
  value: number | null;
  count: number;
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
          className="h-full rounded-full bg-primary/60 transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function CompanionBar({ companion, baselineRate }: { companion: CompanionStat; baselineRate: number | null }) {
  const Icon = companion.icon;
  const width = companion.holdRate !== null ? Math.round(companion.holdRate * 100) : 0;
  const delta = companion.holdRate !== null && baselineRate !== null
    ? Math.round((companion.holdRate - baselineRate) * 100)
    : null;

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Icon className="h-2.5 w-2.5 text-muted-foreground/50" />
          {companion.label}
          <span className="text-muted-foreground/40">({companion.used})</span>
        </span>
        <span className="flex items-center gap-1.5">
          {companion.holdRate !== null ? `${Math.round(companion.holdRate * 100)}%` : '—'}
          {delta !== null && delta !== 0 && (
            <span className={`text-[9px] ${delta > 0 ? 'text-primary' : 'text-destructive'}`}>
              {delta > 0 ? '+' : ''}{delta}pp
            </span>
          )}
        </span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/40 transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}