import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartEmptyState } from './ChartEmptyState';
import { MOOD_GLYPHS } from '@/components/icons/MoodIcon';

interface PauseStatRow {
  mood: string | null;
  outcome: string | null;
}

interface Props {
  /** Mood/outcome rows from recent pause sessions (legacy prop name was `reflections`). */
  sessions: PauseStatRow[];
}

const MOOD_META: Record<string, { glyph: string; color: string; energy: 'high' | 'low' }> = {
  fomo: { glyph: MOOD_GLYPHS.fomo, color: 'bg-destructive/70', energy: 'high' },
  excited: { glyph: MOOD_GLYPHS.excited, color: 'bg-accent/50', energy: 'high' },
  greedy: { glyph: MOOD_GLYPHS.greedy, color: 'bg-destructive/60', energy: 'high' },
  anxious: { glyph: MOOD_GLYPHS.anxious, color: 'bg-destructive/50', energy: 'high' },
  calm: { glyph: MOOD_GLYPHS.calm, color: 'bg-primary/70', energy: 'low' },
  detached: { glyph: MOOD_GLYPHS.detached, color: 'bg-muted-foreground/40', energy: 'low' },
  uncertain: { glyph: MOOD_GLYPHS.uncertain, color: 'bg-muted-foreground/50', energy: 'low' },
  fearful: { glyph: MOOD_GLYPHS.fearful, color: 'bg-destructive/40', energy: 'low' },
};

const MOOD_ORDER = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'];

const OUTCOME_COLORS: Record<string, string> = {
  held: 'bg-primary/70',
  sold: 'bg-destructive/70',
  bought: 'bg-chart-2',
};

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  if (count === 0) return null;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function InsightsPanel({ sessions }: Props) {
  const { t } = useTranslation();

  const { moodCounts, outcomeCounts, totalMoods, totalOutcomes } = useMemo(() => {
    const moods: Record<string, number> = {};
    const outcomes: Record<string, number> = {};
    let tm = 0;
    let to = 0;

    for (const r of sessions) {
      if (r.mood) { moods[r.mood] = (moods[r.mood] || 0) + 1; tm++; }
      if (r.outcome) {
        // Merge legacy 'nothing' into 'held'
        const key = r.outcome === 'nothing' ? 'held' : r.outcome;
        outcomes[key] = (outcomes[key] || 0) + 1; to++;
      }
    }

    return { moodCounts: moods, outcomeCounts: outcomes, totalMoods: tm, totalOutcomes: to };
  }, [sessions]);

  if (totalMoods === 0 && totalOutcomes === 0) {
    return (
      <ChartEmptyState
        title={t('insightsPanel.title')}
        message={t('insightsPanel.emptyMessage', {
          defaultValue:
            'Log a mood or outcome during a pause to see your patterns. Emotional check-ins also contribute.',
        })}
        current={sessions.length}
        needed={1}
      />
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-5">
      <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{t('insightsPanel.title')}</p>

      {totalMoods > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground/70">{t('insightsPanel.howYouFelt')}</p>
          {MOOD_ORDER.map((m) => {
            const meta = MOOD_META[m];
            if (!meta || !moodCounts[m]) return null;
            return (
              <Bar
                key={m}
                label={`${meta.glyph} ${t(`moodCheck.moods.${m}`, { defaultValue: m })}`}
                count={moodCounts[m]}
                total={totalMoods}
                color={meta.color}
              />
            );
          })}
        </div>
      )}

      {totalOutcomes > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground/70">{t('insightsPanel.whatYouDid')}</p>
          {(['held', 'bought', 'sold'] as const).map((o) => (
            <Bar key={o} label={t(`outcome.${o}`, { defaultValue: o })} count={outcomeCounts[o] || 0} total={totalOutcomes} color={OUTCOME_COLORS[o]} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        {t('insightsPanel.basedOn', { count: sessions.length })}
      </p>
    </div>
  );
}
