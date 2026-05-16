import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { JourneyPauseRow } from '@/lib/journey/pause-instances-for-journey';

interface Props {
  rows: readonly JourneyPauseRow[];
}

export function JourneyStreakCard({ rows }: Props) {
  const { t } = useTranslation();

  const { current, longest, days28 } = useMemo(() => {
    const completed = rows.filter((r) => r.state === 'completed');
    const dayKeys = new Set<string>();
    for (const r of completed) {
      const iso = r.completed_at ?? r.engaged_at ?? r.created_at;
      const d = new Date(iso);
      dayKeys.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString());
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days28: Array<{ date: string; active: boolean }> = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      days28.push({ date: key, active: dayKeys.has(key) });
    }

    let current = 0;
    for (let i = 0; ; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      if (dayKeys.has(key)) current++;
      else break;
    }

    const sortedKeys = Array.from(dayKeys).sort();
    let longest = 0;
    let run = 0;
    let prev: number | null = null;
    const dayMs = 24 * 60 * 60 * 1000;
    for (const k of sortedKeys) {
      const tms = new Date(k).getTime();
      if (prev != null && tms - prev === dayMs) run++;
      else run = 1;
      if (run > longest) longest = run;
      prev = tms;
    }

    return { current, longest, days28 };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
          {t('journey.overview.streak.title', { defaultValue: 'Streak' })}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground">
          {t('journey.overview.streak.desc', {
            defaultValue: 'Days with at least one completed pause.',
          })}
        </p>
      </div>

      <div
        className="grid gap-[3px] py-2"
        style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
      >
        {days28.map((d) => (
          <div
            key={d.date}
            className={cn(
              'aspect-square rounded-sm',
              d.active ? 'bg-primary/80' : 'bg-muted/30',
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 text-xs">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{current}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('journey.overview.streak.current', { defaultValue: 'Current' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums">{longest}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('journey.overview.streak.longest', { defaultValue: 'Longest' })}
          </p>
        </div>
      </div>
    </div>
  );
}
