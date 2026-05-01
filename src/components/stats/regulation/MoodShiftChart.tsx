import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { ConfidenceChip } from '@/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';
import { startOfWeek, format } from 'date-fns';

const COMPOSURE: Record<string, number> = {
  calm: 100, detached: 85, uncertain: 60, excited: 50,
  anxious: 30, fearful: 25, greedy: 20, fomo: 10,
};

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * Regulation deep-dive card: weekly mood_shift (after - before) from
 * initial_emotion_logged + shift_emotion_logged. Positive = mood improved
 * after the pause. Denominator: completed pauses with both emotions logged.
 */
export function MoodShiftChart({ rows }: Props) {
  const { t } = useTranslation();

  const { weekly, sample, feelIntensityLogged, shiftIntensityLogged } = useMemo(() => {
    const withPair = rows.filter(
      (r) =>
        r.initial_mood != null &&
        r.shift_mood != null &&
        COMPOSURE[r.initial_mood] != null &&
        COMPOSURE[r.shift_mood] != null,
    );
    const byWeek = new Map<string, { sum: number; n: number }>();
    for (const r of withPair) {
      const iso = r.completed_at ?? r.engaged_at ?? r.created_at;
      const weekStart = startOfWeek(new Date(iso), { weekStartsOn: 1 }).toISOString();
      const delta = (COMPOSURE[r.shift_mood!] ?? 50) - (COMPOSURE[r.initial_mood!] ?? 50);
      const entry = byWeek.get(weekStart) ?? { sum: 0, n: 0 };
      entry.sum += delta;
      entry.n += 1;
      byWeek.set(weekStart, entry);
    }
    const weekly = Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([iso, e]) => ({
        week: format(new Date(iso), 'MMM d'),
        avg: Math.round(e.sum / e.n),
        count: e.n,
      }));
    const isIntensity = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
    const feelIntensityLogged = withPair.filter((r) => isIntensity(r.initial_emotion_intensity)).length;
    const shiftIntensityLogged = withPair.filter((r) => isIntensity(r.shift_emotion_intensity)).length;
    return { weekly, sample: withPair.length, feelIntensityLogged, shiftIntensityLogged };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.regulation.moodShift.title', { defaultValue: 'Mood shift' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.regulation.moodShift.desc', {
              defaultValue: 'Average mood change across your pause (after − before).',
            })}
          </p>
        </div>
        <ConfidenceChip
          confidence={sampleConfidence(sample)}
          sampleSize={sample}
          sampleLabel="pauses with both emotions logged"
        />
      </div>
      {weekly.length === 0 ? (
        <p className="py-6 text-center text-xs italic text-muted-foreground">
          {t('stats.regulation.moodShift.empty', {
            defaultValue: 'Complete the full pause flow to see your mood shift.',
          })}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekly} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="avg" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      )}
      <p className="pt-2 text-[10px] text-muted-foreground">
        {t('stats.regulation.moodShift.formula', {
          defaultValue: 'Formula: avg(composure(shift_mood) − composure(initial_mood)) per week.',
        })}
      </p>
      {sample > 0 && (feelIntensityLogged > 0 || shiftIntensityLogged > 0) ? (
        <p className="pt-1 text-[10px] text-muted-foreground/90">
          {t('stats.regulation.moodShift.intensityFootnote', {
            feel: feelIntensityLogged,
            shift: shiftIntensityLogged,
            sample,
            defaultValue:
              'Feel / shift 1–5 scales logged on {{feel}} / {{shift}} of {{sample}} pauses in this sample.',
          })}
        </p>
      ) : null}
    </div>
  );
}
