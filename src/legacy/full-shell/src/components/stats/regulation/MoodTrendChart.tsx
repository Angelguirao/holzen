import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ConfidenceChip } from '@/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';
import { format, startOfWeek } from 'date-fns';

const MOOD_VALUE: Record<string, number> = {
  calm: 5, detached: 4, uncertain: 3, excited: 3,
  anxious: 2, fearful: 2, greedy: 1, fomo: 1,
};

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * Regulation deep dive: average mood score over time. Uses initial_mood
 * only (the entry emotion); shift_mood is covered by MoodShiftChart.
 */
export function MoodTrendChart({ rows }: Props) {
  const { t } = useTranslation();

  const { weekly, sample } = useMemo(() => {
    const withMood = rows.filter(
      (r) => r.initial_mood != null && MOOD_VALUE[r.initial_mood] != null,
    );
    const byWeek = new Map<string, { sum: number; n: number }>();
    for (const r of withMood) {
      const iso = r.engaged_at ?? r.created_at;
      const weekStart = startOfWeek(new Date(iso), { weekStartsOn: 1 }).toISOString();
      const e = byWeek.get(weekStart) ?? { sum: 0, n: 0 };
      e.sum += MOOD_VALUE[r.initial_mood!] ?? 3;
      e.n += 1;
      byWeek.set(weekStart, e);
    }
    const weekly = Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([iso, e]) => ({ week: format(new Date(iso), 'MMM d'), avg: +(e.sum / e.n).toFixed(2) }));
    return { weekly, sample: withMood.length };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.regulation.moodTrend.title', { defaultValue: 'Mood trend' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.regulation.moodTrend.desc', {
              defaultValue: 'Average entry-mood score (1 reactive → 5 calm) per week.',
            })}
          </p>
        </div>
        <ConfidenceChip confidence={sampleConfidence(sample)} sampleSize={sample} sampleLabel="pauses with initial mood" />
      </div>
      {weekly.length === 0 ? (
        <p className="py-6 text-center text-xs italic text-muted-foreground">
          {t('stats.regulation.moodTrend.empty', { defaultValue: 'Log your mood in a pause to see the trend.' })}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={weekly} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
