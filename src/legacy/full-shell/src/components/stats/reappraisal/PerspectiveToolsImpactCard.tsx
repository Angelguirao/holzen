import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfidenceChip } from '@/legacy/full-shell/src/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/legacy/full-shell/src/lib/stats/confidence';
import type { PauseFullRow } from '@/legacy/full-shell/src/lib/pause-stats-data-query';

// Live UI emits `held | bought | sold` only; legacy `nothing` rows fall through
// (consistent with src/lib/badges/compute.ts).
const HOLD = new Set(['held']);

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * Reappraisal deep dive. "Perspective tools impact" = hold rate when >=1
 * companion counted, minus hold rate when 0 companions counted. Positive
 * lift = opening a companion correlated with holding more often.
 */
export function PerspectiveToolsImpactCard({ rows }: Props) {
  const { t } = useTranslation();

  const { withRate, withoutRate, lift, withN, withoutN } = useMemo(() => {
    const completed = rows.filter((r) => r.state === 'completed' && r.outcome);
    const withTools = completed.filter((r) => r.counted_companion_count > 0);
    const withoutTools = completed.filter((r) => r.counted_companion_count === 0);
    const fract = (arr: PauseFullRow[]) =>
      arr.length === 0 ? null : Math.round(
        (arr.filter((r) => HOLD.has(r.outcome!)).length / arr.length) * 100,
      );
    const withRate = fract(withTools);
    const withoutRate = fract(withoutTools);
    const lift =
      withRate != null && withoutRate != null ? withRate - withoutRate : null;
    return { withRate, withoutRate, lift, withN: withTools.length, withoutN: withoutTools.length };
  }, [rows]);

  const sample = withN + withoutN;
  const canShowLift = withN >= 5 && withoutN >= 5;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.reappraisal.title', { defaultValue: 'Perspective tools impact' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.reappraisal.desc', {
              defaultValue: 'Hold rate comparison: with companions vs without.',
            })}
          </p>
        </div>
        <ConfidenceChip confidence={sampleConfidence(sample)} sampleSize={sample} sampleLabel="completed pauses with outcome" />
      </div>

      {!canShowLift ? (
        <p className="py-4 text-xs italic text-muted-foreground">
          {t('stats.reappraisal.insufficient', {
            defaultValue: 'Need at least 5 pauses in each bucket (with / without companions) to show a meaningful comparison.',
          })}
        </p>
      ) : (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('stats.reappraisal.with', { defaultValue: 'With ≥1 companion' })}
            </span>
            <span className="tabular-nums font-mono">
              {withRate}% <span className="text-[10px] text-muted-foreground/60">({withN})</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('stats.reappraisal.without', { defaultValue: 'Without companions' })}
            </span>
            <span className="tabular-nums font-mono">
              {withoutRate}% <span className="text-[10px] text-muted-foreground/60">({withoutN})</span>
            </span>
          </div>
          <div className="pt-2 text-3xl font-semibold tabular-nums">
            {lift! >= 0 ? '+' : ''}
            {lift}
            <span className="ml-1 text-base font-sans text-muted-foreground">pp</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('stats.reappraisal.lift', { defaultValue: 'hold-rate lift' })}
          </p>
        </div>
      )}
      <p className="pt-3 text-[10px] text-muted-foreground">
        {t('stats.reappraisal.formula', {
          defaultValue:
            'Formula: hold rate among completed pauses with ≥1 counted companion − hold rate among those with none. Shown only when each bucket has ≥5 samples.',
        })}
      </p>
    </div>
  );
}
