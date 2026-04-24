import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfidenceChip } from '@/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';

type Severity = 'mild' | 'moderate' | 'high';
const HOLD_OUTCOMES = new Set(['held', 'nothing']);

interface Props {
  rows: readonly PauseFullRow[];
}

function severityOf(r: PauseFullRow): Severity | null {
  const s = r.context_snapshot?.severity;
  if (s === 'mild' || s === 'moderate' || s === 'high') return s;
  return null;
}

interface Bucket {
  label: string;
  total: number;
  holds: number;
}

/**
 * Tolerance deep dive: hold rate by context severity bucket. Headline is
 * the "high-volatility hold rate" — of your pauses during severe BTC
 * moves, how often did you hold/do nothing?
 */
export function VolatilityToleranceCardV2({ rows }: Props) {
  const { t } = useTranslation();

  const { buckets, highRate, highSample } = useMemo(() => {
    const completedWithOutcome = rows.filter((r) => r.state === 'completed' && r.outcome);
    const init: Record<Severity, Bucket> = {
      mild: { label: 'mild', total: 0, holds: 0 },
      moderate: { label: 'moderate', total: 0, holds: 0 },
      high: { label: 'high', total: 0, holds: 0 },
    };
    for (const r of completedWithOutcome) {
      const sev = severityOf(r);
      if (!sev) continue;
      init[sev].total += 1;
      if (HOLD_OUTCOMES.has(r.outcome!)) init[sev].holds += 1;
    }
    const highRate = init.high.total === 0 ? null : Math.round((init.high.holds / init.high.total) * 100);
    return { buckets: [init.mild, init.moderate, init.high], highRate, highSample: init.high.total };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.tolerance.title', { defaultValue: 'Volatility tolerance' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.tolerance.desc', {
              defaultValue: 'Hold rate bucketed by market-move severity.',
            })}
          </p>
        </div>
        <ConfidenceChip
          confidence={sampleConfidence(highSample)}
          sampleSize={highSample}
          sampleLabel="high-severity completed pauses"
        />
      </div>

      <p className="pt-2 text-3xl font-semibold tabular-nums">
        {highRate == null ? '—' : `${highRate}%`}
        <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {t('stats.tolerance.headline', { defaultValue: 'high-vol hold rate' })}
        </span>
      </p>

      <div className="mt-3 space-y-1.5">
        {buckets.map((b) => {
          const pct = b.total === 0 ? null : Math.round((b.holds / b.total) * 100);
          return (
            <div key={b.label} className="flex items-center justify-between text-xs">
              <span className="capitalize text-muted-foreground">{b.label}</span>
              <span className="tabular-nums font-mono">
                {pct == null ? '—' : `${pct}%`}{' '}
                <span className="text-[10px] text-muted-foreground/60">
                  ({b.holds}/{b.total})
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <p className="pt-3 text-[10px] text-muted-foreground">
        {t('stats.tolerance.formula', {
          defaultValue:
            'Formula: completed pauses with outcome ∈ {held, nothing} ÷ completed pauses in that severity bucket.',
        })}
      </p>
    </div>
  );
}
