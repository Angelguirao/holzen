import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfidenceChip } from '@/legacy/full-shell/src/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * "Outcome stability" (reframed from legacy DecisionAccuracy): share of
 * completed pauses across the last 30 that ended held/nothing (i.e. you
 * didn't act impulsively). Replaces the follow_ups-based accuracy card.
 */
export function OutcomeStabilityCard({ rows }: Props) {
  const { t } = useTranslation();

  const { rate, recent } = useMemo(() => {
    const completed = rows.filter((r) => r.state === 'completed' && r.outcome);
    const recent = completed.slice(0, 30);
    const held = recent.filter((r) => r.outcome === 'held').length;
    const rate = recent.length === 0 ? null : Math.round((held / recent.length) * 100);
    return { rate, recent: recent.length };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.tolerance.stability.title', { defaultValue: 'Outcome stability' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.tolerance.stability.desc', {
              defaultValue: 'How often pauses end in held/do-nothing decisions.',
            })}
          </p>
        </div>
        <ConfidenceChip confidence={sampleConfidence(recent)} sampleSize={recent} sampleLabel="recent completed pauses" />
      </div>

      <p className="pt-2 text-3xl font-semibold tabular-nums">
        {rate == null ? '—' : `${rate}%`}
      </p>

      <p className="pt-3 text-[10px] text-muted-foreground">
        {t('stats.tolerance.stability.formula', {
          defaultValue:
            'Formula: (outcome ∈ {held, nothing}) ÷ last 30 completed pauses.',
        })}
      </p>
    </div>
  );
}
