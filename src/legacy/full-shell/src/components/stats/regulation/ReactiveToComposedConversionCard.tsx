import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfidenceChip } from '@/legacy/full-shell/src/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';
import { effectivePauseShiftMood } from '@/lib/pause-effective-emotion';

const REACTIVE = new Set(['fomo', 'greedy', 'fearful', 'anxious', 'excited']);
const COMPOSED = new Set(['calm', 'detached']);

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * "Reactive → Composed conversion rate": of the pauses where entry mood was
 * reactive, what fraction ended in a composed mood_after? Headline metric
 * for the Regulation skill per the target-model deep-dive spec.
 */
export function ReactiveToComposedConversionCard({ rows }: Props) {
  const { t } = useTranslation();

  const { rate, reactiveTotal } = useMemo(() => {
    const reactive = rows.filter(
      (r) => r.initial_mood != null && REACTIVE.has(r.initial_mood),
    );
    const converted = reactive.filter((r) => {
      const after = effectivePauseShiftMood(r);
      return after != null && COMPOSED.has(after);
    });
    const rate =
      reactive.length === 0 ? null : Math.round((converted.length / reactive.length) * 100);
    return { rate, reactiveTotal: reactive.length };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.regulation.conversion.title', { defaultValue: 'Reactive → composed' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.regulation.conversion.desc', {
              defaultValue: 'Share of reactive entries that ended calm or detached.',
            })}
          </p>
        </div>
        <ConfidenceChip
          confidence={sampleConfidence(reactiveTotal)}
          sampleSize={reactiveTotal}
          sampleLabel="reactive-entry pauses"
        />
      </div>
      <p className="pt-2 text-3xl font-semibold tabular-nums">
        {rate == null ? '—' : `${rate}%`}
      </p>
      <p className="pt-2 text-[10px] text-muted-foreground">
        {t('stats.regulation.conversion.formula', {
          defaultValue:
            'Denominator: pauses with a reactive initial mood (fomo/greedy/fearful/anxious/excited). Numerator: same set whose shift mood was calm or detached.',
        })}
      </p>
    </div>
  );
}
