import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';
import { effectivePauseShiftMood } from '@/lib/pause-effective-emotion';
import {
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  isWithinInterval, format,
} from 'date-fns';

// Live UI emits `held | bought | sold` only; legacy `nothing` rows fall through
// (consistent with src/lib/badges/compute.ts).
const HOLD = new Set(['held']);
const CALM = new Set(['calm', 'detached']);

interface Props {
  rows: readonly PauseFullRow[];
}

type View = 'weekly' | 'monthly';

interface Stats {
  count: number;
  holdRate: number | null;
  calmExitRate: number | null;
}

function computeStats(subset: PauseFullRow[]): Stats {
  const completed = subset.filter((r) => r.state === 'completed' && r.outcome);
  const hold = completed.filter((r) => HOLD.has(r.outcome!)).length;
  const holdRate = completed.length === 0 ? null : hold / completed.length;

  const withShift = completed.filter((r) => effectivePauseShiftMood(r));
  const calmExits = withShift.filter((r) => CALM.has(effectivePauseShiftMood(r)!)).length;
  const calmExitRate = withShift.length === 0 ? null : calmExits / withShift.length;

  return { count: completed.length, holdRate, calmExitRate };
}

function delta(a: number | null, b: number | null): { sign: 1 | -1 | 0; value: number } | null {
  if (a == null || b == null) return null;
  const diff = a - b;
  const sign = diff > 0.01 ? 1 : diff < -0.01 ? -1 : 0;
  return { sign, value: Math.round(Math.abs(diff) * 100) };
}

/**
 * Journey deep-dive: weekly/monthly comparison of pause volume + hold
 * rate + calm-exit rate.
 */
export function PeriodComparisonCard({ rows }: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('weekly');

  const { current, previous, currentLabel, prevLabel } = useMemo(() => {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;
    let currentLabel: string, prevLabel: string;

    if (view === 'weekly') {
      currentStart = startOfWeek(now, { weekStartsOn: 1 });
      currentEnd = endOfWeek(now, { weekStartsOn: 1 });
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      currentLabel = t('stats.journey.period.thisWeek', { defaultValue: 'This week' });
      prevLabel = t('stats.journey.period.lastWeek', { defaultValue: 'Last week' });
    } else {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      prevEnd = endOfMonth(subMonths(now, 1));
      currentLabel = format(now, 'MMM yyyy');
      prevLabel = format(subMonths(now, 1), 'MMM yyyy');
    }

    const bucket = (start: Date, end: Date) =>
      rows.filter((r) =>
        isWithinInterval(new Date(r.completed_at ?? r.engaged_at ?? r.created_at), {
          start,
          end,
        }),
      );

    return {
      current: computeStats(bucket(currentStart, currentEnd)),
      previous: computeStats(bucket(prevStart, prevEnd)),
      currentLabel,
      prevLabel,
    };
  }, [rows, view, t]);

  const deltas = {
    count: delta(current.count, previous.count),
    holdRate: delta(current.holdRate, previous.holdRate),
    calmExitRate: delta(current.calmExitRate, previous.calmExitRate),
  };

  const renderRow = (
    label: string,
    currVal: string,
    prevVal: string,
    d: ReturnType<typeof delta>,
  ) => {
    const Icon = d?.sign === 1 ? ArrowUpRight : d?.sign === -1 ? ArrowDownRight : Minus;
    const color =
      d?.sign === 1 ? 'text-emerald-500' : d?.sign === -1 ? 'text-destructive/80' : 'text-muted-foreground';
    return (
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-mono">{currVal}</span>
          <span className="text-[10px] text-muted-foreground/60">vs {prevVal}</span>
          {d && (
            <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-mono', color)}>
              <Icon className="h-2.5 w-2.5" aria-hidden />
              {d.sign === 0 ? '—' : `${d.value}`}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
          {t('stats.journey.period.title', { defaultValue: 'Period comparison' })}
        </p>
        <div className="flex items-center gap-1 rounded-md border border-border/40 p-0.5">
          {(['weekly', 'monthly'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest transition-colors',
                view === v
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground/60 hover:text-muted-foreground',
              )}
            >
              {t(`stats.journey.period.${v}`, { defaultValue: v })}
            </button>
          ))}
        </div>
      </div>

      <p className="pb-2 text-[10px] font-mono text-muted-foreground">
        {currentLabel} vs {prevLabel}
      </p>

      <div className="space-y-1.5">
        {renderRow(
          t('stats.journey.period.pauses', { defaultValue: 'Pauses' }),
          String(current.count),
          String(previous.count),
          deltas.count,
        )}
        {renderRow(
          t('stats.journey.period.holdRate', { defaultValue: 'Hold rate' }),
          current.holdRate == null ? '—' : `${Math.round(current.holdRate * 100)}%`,
          previous.holdRate == null ? '—' : `${Math.round(previous.holdRate * 100)}%`,
          deltas.holdRate,
        )}
        {renderRow(
          t('stats.journey.period.calmExits', { defaultValue: 'Calm exits' }),
          current.calmExitRate == null ? '—' : `${Math.round(current.calmExitRate * 100)}%`,
          previous.calmExitRate == null ? '—' : `${Math.round(previous.calmExitRate * 100)}%`,
          deltas.calmExitRate,
        )}
      </div>
    </div>
  );
}
