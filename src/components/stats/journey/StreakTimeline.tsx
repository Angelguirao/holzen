import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfidenceChip } from '@/components/stats/ConfidenceChip';
import { sampleConfidence } from '@/lib/stats/confidence';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';
import { cn } from '@/lib/utils';

interface Props {
  rows: readonly PauseFullRow[];
}

/**
 * Journey deep dive: 28-day streak heatmap of completed pauses + current
 * / longest streak counters. Aligned with the legacy streak UX but fed
 * exclusively from pause_instances.
 */
export function StreakTimeline({ rows }: Props) {
  const { t } = useTranslation();

  const { current, longest, days28, totalCompleted } = useMemo(() => {
    const completed = rows.filter((r) => r.state === 'completed');
    const dayKeys = new Set<string>();
    for (const r of completed) {
      const iso = r.completed_at ?? r.engaged_at ?? r.created_at;
      const d = new Date(iso);
      dayKeys.add(
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString(),
      );
    }

    // 28-day window ending today.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days28: Array<{ date: string; active: boolean }> = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      days28.push({ date: key, active: dayKeys.has(key) });
    }

    // Current streak backwards from today.
    let current = 0;
    for (let i = 0; ; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      if (dayKeys.has(key)) current++;
      else break;
    }

    // Longest streak (within last 365 days for perf).
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

    return { current, longest, days28, totalCompleted: completed.length };
  }, [rows]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.journey.streak.title', { defaultValue: 'Streak' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.journey.streak.desc', {
              defaultValue: 'Days with at least one completed pause.',
            })}
          </p>
        </div>
        <ConfidenceChip
          confidence={sampleConfidence(totalCompleted)}
          sampleSize={totalCompleted}
          sampleLabel="completed pauses"
        />
      </div>

      <div className="grid grid-cols-14 gap-[3px] py-2" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
        {days28.map((d) => (
          <div
            key={d.date}
            className={cn(
              'aspect-square rounded-sm',
              d.active ? 'bg-primary/80' : 'bg-muted/30',
            )}
            aria-label={`${d.date.slice(0, 10)}${d.active ? ' active' : ''}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 text-xs">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{current}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('stats.journey.streak.current', { defaultValue: 'Current' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums">{longest}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t('stats.journey.streak.longest', { defaultValue: 'Longest' })}
          </p>
        </div>
      </div>
    </div>
  );
}
