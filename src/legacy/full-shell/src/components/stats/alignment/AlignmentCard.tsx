import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { ConfidenceChip } from '@/legacy/full-shell/src/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';

interface HoldGoal {
  type: string | null;
  targetMonths: number | null;
  targetPrice: number | null;
  start: string | null;
}

interface Props {
  rows: readonly PauseFullRow[];
  holdGoal?: HoldGoal | null;
  onConfigureHoldGoal?: () => void;
}

/**
 * Alignment deep dive. Shows hold-goal-aligned outcome rate when a goal
 * is configured; otherwise renders a CTA to configure one (per target
 * model — no synthetic bar).
 */
export function AlignmentCard({ rows, holdGoal, onConfigureHoldGoal }: Props) {
  const { t } = useTranslation();

  const { rate, sample } = useMemo(() => {
    if (!holdGoal?.type) return { rate: null as number | null, sample: 0 };
    const completed = rows.filter((r) => r.state === 'completed' && r.outcome);
    const aligned = completed.filter((r) => r.outcome === 'held');
    const rate = completed.length === 0 ? null : Math.round((aligned.length / completed.length) * 100);
    return { rate, sample: completed.length };
  }, [rows, holdGoal]);

  const notConfigured = !holdGoal?.type;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.alignment.title', { defaultValue: 'Alignment with hold goal' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.alignment.desc', {
              defaultValue: 'Share of decisions that align with your configured goal.',
            })}
          </p>
        </div>
        {!notConfigured && (
          <ConfidenceChip
            confidence={sampleConfidence(sample)}
            sampleSize={sample}
            sampleLabel="completed pauses with outcome"
          />
        )}
      </div>

      {notConfigured ? (
        <div className="space-y-2">
          <p className="text-sm italic text-muted-foreground">
            {t('stats.alignment.notConfigured', {
              defaultValue: 'Set a hold goal to measure how decisions align with your plan.',
            })}
          </p>
          {onConfigureHoldGoal && (
            <button
              type="button"
              onClick={onConfigureHoldGoal}
              className="inline-flex items-center gap-1 text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
            >
              {t('stats.alignment.cta', { defaultValue: 'Set a hold goal' })}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="pt-2 text-3xl font-semibold tabular-nums">
            {rate == null ? '—' : `${rate}%`}
          </p>
          <p className="pt-3 text-[10px] text-muted-foreground">
            {t('stats.alignment.formula', {
              defaultValue:
                'Formula: completed pauses whose outcome aligns with your goal ÷ completed pauses with an outcome.',
            })}
          </p>
        </>
      )}
    </div>
  );
}
