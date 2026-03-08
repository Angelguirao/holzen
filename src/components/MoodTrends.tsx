import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartEmptyState } from './ChartEmptyState';
import { format, parseISO, startOfWeek } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  reflections: { created_at: string; mood: string | null }[];
}

const MOOD_MAP: Record<string, number> = {
  fomo: 1, greedy: 1.5, anxious: 2, fearful: 2, excited: 2.5,
  uncertain: 3, detached: 4, calm: 5,
};

export function MoodTrends({ reflections }: Props) {
  const { t } = useTranslation();

  const MOOD_LABELS: Record<number, string> = {
    1: t('moodCharts.reactive'), 3: t('moodCharts.neutral'), 5: t('moodCharts.composed'),
  };

  const data = useMemo(() => {
    const withMood = reflections
      .filter((r) => r.mood && MOOD_MAP[r.mood] !== undefined)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    if (withMood.length < 2) return null;

    const weeks = new Map<string, { total: number; count: number }>();
    for (const r of withMood) {
      const weekKey = format(startOfWeek(parseISO(r.created_at), { weekStartsOn: 1 }), 'MMM d');
      const existing = weeks.get(weekKey) || { total: 0, count: 0 };
      existing.total += MOOD_MAP[r.mood!];
      existing.count += 1;
      weeks.set(weekKey, existing);
    }

    return Array.from(weeks.entries()).map(([week, { total, count }]) => ({
      week,
      avg: Math.round((total / count) * 100) / 100,
    }));
  }, [reflections]);

  if (!data || data.length < 3) {
    return (
      <ChartEmptyState
        title={t('moodCharts.moodOverTime')}
        message={t('moodCharts.moodOverTimeEmpty')}
        current={data?.length ?? 0}
        needed={3}
      />
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
        {t('moodCharts.moodOverTime')}
      </p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="week" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tickFormatter={(v: number) => MOOD_LABELS[v] ?? ''} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
              formatter={(value: number) => [value < 2 ? t('moodCharts.reactive') : value < 3.5 ? t('moodCharts.mixed') : t('moodCharts.composed'), t('moodCharts.avgComposure')]}
              labelStyle={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}
            />
            <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#moodGrad)" dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
        {t('moodCharts.weeklyAverageMoodChecks')}
      </p>
    </div>
  );
}
