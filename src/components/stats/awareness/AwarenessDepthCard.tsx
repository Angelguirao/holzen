import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfidenceChip } from '@/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * Awareness depth card: distribution of depth signals (notes, tags,
 * favorites) across completed pauses. Aggregate "depth pauses" =
 * any of the three signals present.
 */
export function AwarenessDepthCard({ rows }: Props) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.state === 'completed');
    const total = completed.length;
    const notes = completed.filter((r) => (r.note_text ?? '').length > 20).length;
    const tags = completed.filter((r) => r.tags && r.tags.length > 0).length;
    const favs = completed.filter((r) => r.is_favorite).length;
    const anyDepth = completed.filter(
      (r) =>
        (r.note_text ?? '').length > 20 ||
        (r.tags && r.tags.length > 0) ||
        r.is_favorite,
    ).length;
    return { total, notes, tags, favs, anyDepth };
  }, [rows]);

  const pct = (n: number) =>
    stats.total === 0 ? null : Math.round((n / stats.total) * 100);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.awareness.title', { defaultValue: 'Reflection depth' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.awareness.desc', {
              defaultValue: 'How often you add notes, tags, or favorite a pause.',
            })}
          </p>
        </div>
        <ConfidenceChip confidence={sampleConfidence(stats.total)} sampleSize={stats.total} sampleLabel="completed pauses" />
      </div>

      <p className="pt-2 text-3xl font-semibold tabular-nums">
        {pct(stats.anyDepth) == null ? '—' : `${pct(stats.anyDepth)}%`}
        <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {t('stats.awareness.any', { defaultValue: 'any depth signal' })}
        </span>
      </p>

      <div className="mt-3 space-y-1.5">
        {[
          { label: t('stats.awareness.note', { defaultValue: 'Note length > 20 chars' }), count: stats.notes },
          { label: t('stats.awareness.tag', { defaultValue: 'Tagged ≥1 tag' }), count: stats.tags },
          { label: t('stats.awareness.favorite', { defaultValue: 'Favorited' }), count: stats.favs },
        ].map((row) => {
          const p = pct(row.count);
          return (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="tabular-nums font-mono">
                {p == null ? '—' : `${p}%`}{' '}
                <span className="text-[10px] text-muted-foreground/60">({row.count})</span>
              </span>
            </div>
          );
        })}
      </div>

      <p className="pt-3 text-[10px] text-muted-foreground">
        {t('stats.awareness.formula', {
          defaultValue:
            'Depth signals: note_text length > 20, tags.length >= 1, or is_favorite=true. Denominators: all completed pauses.',
        })}
      </p>
    </div>
  );
}
