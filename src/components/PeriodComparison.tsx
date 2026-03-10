import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Minus, CalendarDays } from 'lucide-react';
import { ChartEmptyState } from './ChartEmptyState';
import {
  startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths,
  parseISO, isWithinInterval, format,
} from 'date-fns';

interface Reflection {
  created_at: string;
  mood: string | null;
  outcome: string | null;
  breathing_completed: boolean;
  haiku_read: boolean;
  learning_read: boolean;
  signal_read?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
}

interface Props {
  reflections: Reflection[];
}

const MOOD_SCORES: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

interface PeriodStats {
  count: number;
  holdRate: number | null;
  composure: number | null;
  companionUsage: number | null;
}

function computeStats(refs: Reflection[]): PeriodStats {
  if (refs.length === 0) return { count: 0, holdRate: null, composure: null, companionUsage: null };

  const withOutcome = refs.filter((r) => r.outcome);
  const held = withOutcome.filter((r) => r.outcome === 'held' || r.outcome === 'nothing');
  const holdRate = withOutcome.length > 0 ? held.length / withOutcome.length : null;

  const moods = refs.filter((r) => r.mood && MOOD_SCORES[r.mood] !== undefined);
  const composure = moods.length > 0
    ? moods.reduce((s, r) => s + (MOOD_SCORES[r.mood!] ?? 50), 0) / moods.length
    : null;

  const withCompanion = refs.filter(
    (r) => r.breathing_completed || r.haiku_read || r.learning_read || r.signal_read || r.zoom_out_read || r.history_read
  );
  const companionUsage = refs.length > 0 ? withCompanion.length / refs.length : null;

  return { count: refs.length, holdRate, composure, companionUsage };
}

type View = 'weekly' | 'monthly';

export function PeriodComparison({ reflections }: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('weekly');

  const { current, previous, currentLabel, previousLabel } = useMemo(() => {
    const now = new Date();

    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;
    let currentLabel: string, previousLabel: string;

    if (view === 'weekly') {
      currentStart = startOfWeek(now, { weekStartsOn: 1 });
      currentEnd = endOfWeek(now, { weekStartsOn: 1 });
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      currentLabel = t('periodComparison.thisWeek');
      previousLabel = t('periodComparison.lastWeek');
    } else {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      prevEnd = endOfMonth(subMonths(now, 1));
      currentLabel = format(now, 'MMMM');
      previousLabel = format(subMonths(now, 1), 'MMMM');
    }

    const currentRefs = reflections.filter((r) => {
      const d = parseISO(r.created_at);
      return isWithinInterval(d, { start: currentStart, end: currentEnd });
    });
    const prevRefs = reflections.filter((r) => {
      const d = parseISO(r.created_at);
      return isWithinInterval(d, { start: prevStart, end: prevEnd });
    });

    return {
      current: computeStats(currentRefs),
      previous: computeStats(prevRefs),
      currentLabel,
      previousLabel,
    };
  }, [reflections, view, t]);

  if (current.count === 0 && previous.count === 0) {
    return (
      <ChartEmptyState
        title={t('periodComparison.title', 'Period Comparison')}
        message={t('periodComparison.emptyMessage', 'Start reflecting this week to compare your progress across periods.')}
        current={reflections.length}
        needed={1}
      />
    );
  }

  const metrics = [
    {
      label: t('periodComparison.reflections'),
      current: current.count,
      previous: previous.count,
      format: (v: number) => `${v}`,
      delta: previous.count > 0 ? current.count - previous.count : null,
      deltaFormat: (d: number) => `${d > 0 ? '+' : ''}${d}`,
    },
    {
      label: t('periodComparison.holdRate'),
      current: current.holdRate,
      previous: previous.holdRate,
      format: (v: number) => `${Math.round(v * 100)}%`,
      delta: current.holdRate !== null && previous.holdRate !== null
        ? Math.round((current.holdRate - previous.holdRate) * 100)
        : null,
      deltaFormat: (d: number) => `${d > 0 ? '+' : ''}${d}pp`,
    },
    {
      label: t('periodComparison.composure'),
      current: current.composure,
      previous: previous.composure,
      format: (v: number) => `${Math.round(v)}`,
      delta: current.composure !== null && previous.composure !== null
        ? Math.round(current.composure - previous.composure)
        : null,
      deltaFormat: (d: number) => `${d > 0 ? '+' : ''}${d}`,
    },
    {
      label: t('periodComparison.companionUse'),
      current: current.companionUsage,
      previous: previous.companionUsage,
      format: (v: number) => `${Math.round(v * 100)}%`,
      delta: current.companionUsage !== null && previous.companionUsage !== null
        ? Math.round((current.companionUsage - previous.companionUsage) * 100)
        : null,
      deltaFormat: (d: number) => `${d > 0 ? '+' : ''}${d}pp`,
    },
  ];

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {t('periodComparison.title')}
          </p>
        </div>
        <div className="flex rounded bg-muted/50 p-0.5">
          {(['weekly', 'monthly'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                view === v
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {v === 'weekly' ? 'W' : 'M'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
        <div />
        <p className="text-[9px] font-mono text-muted-foreground/50 text-right">{previousLabel}</p>
        <p className="text-[9px] font-mono text-muted-foreground/80 text-right">{currentLabel}</p>
      </div>

      <div className="space-y-3">
        {metrics.map((m) => (
          <MetricRow key={m.label} {...m} />
        ))}
      </div>

      {previous.count === 0 && current.count > 0 && (
        <p className="text-[10px] text-muted-foreground/40 italic">
          {t('periodComparison.noDataPrevious', {
            period: previousLabel.toLowerCase(),
            next: view === 'weekly' ? t('periodComparison.week') : t('periodComparison.month'),
          })}
        </p>
      )}
    </div>
  );
}

function MetricRow({
  label,
  current,
  previous,
  format: fmt,
  delta,
  deltaFormat,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  format: (v: number) => string;
  delta: number | null;
  deltaFormat: (d: number) => string;
}) {
  const DeltaIcon = delta !== null && delta > 0 ? ArrowUpRight : delta !== null && delta < 0 ? ArrowDownRight : Minus;
  const deltaColor = delta !== null && delta > 0
    ? 'text-primary'
    : delta !== null && delta < 0
      ? 'text-destructive'
      : 'text-muted-foreground/40';

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
        {delta !== null && delta !== 0 && (
          <span className={`flex items-center gap-0.5 text-[9px] font-mono ${deltaColor}`}>
            <DeltaIcon className="h-2.5 w-2.5" />
            {deltaFormat(delta)}
          </span>
        )}
      </div>
      <span className="text-[11px] font-mono text-muted-foreground/50 text-right tabular-nums">
        {previous !== null ? fmt(previous) : '—'}
      </span>
      <span className="text-[11px] font-mono text-foreground text-right tabular-nums min-w-[32px]">
        {current !== null ? fmt(current) : '—'}
      </span>
    </div>
  );
}
