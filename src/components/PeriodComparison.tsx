import { forwardRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Minus, CalendarDays } from 'lucide-react';
import { ChartEmptyState } from './ChartEmptyState';
import {
  startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths,
  isWithinInterval, format,
} from 'date-fns';
import { filterCompleted, pauseTimestamp } from '@/lib/engaged-pause';

interface Reflection {
  created_at: string;
  engaged_at?: string | null;
  mood: string | null;
  mood_after?: string | null;
  outcome: string | null;
  context?: string | null;
  breathing_completed: boolean;
  haiku_read: boolean;
  grounding_read: boolean;
  signal_read?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
  note?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean;
}

interface HoldGoal {
  type: string | null;
  targetMonths: number | null;
  targetPrice: number | null;
  start: string | null;
}

interface Props {
  reflections: Reflection[];
  holdGoal?: HoldGoal | null;
}

interface PeriodStats {
  count: number;
  holdRate: number | null;
  calmExitRate: number | null;
}

const CALM_MOODS = ['calm', 'detached'];

function computeStats(refs: Reflection[]): PeriodStats {
  // Denominator = pauses where a decision was recorded. Ignored notifications
  // (no outcome) are excluded so they can't pull hold-rate / calm-exit rate down.
  const completed = filterCompleted(refs);
  if (completed.length === 0) return { count: 0, holdRate: null, calmExitRate: null };

  const held = completed.filter((r) => r.outcome === 'held' || r.outcome === 'nothing');
  const holdRate = completed.length > 0 ? held.length / completed.length : null;

  const withMoodAfter = completed.filter((r) => r.mood_after);
  const calmExits = withMoodAfter.filter((r) => CALM_MOODS.includes(r.mood_after!));
  const calmExitRate = withMoodAfter.length > 0 ? calmExits.length / withMoodAfter.length : null;

  return { count: completed.length, holdRate, calmExitRate };
}

type View = 'weekly' | 'monthly';

export function PeriodComparison({ reflections, holdGoal }: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('weekly');

  const { currentRefs, prevRefs, currentLabel, previousLabel } = useMemo(() => {
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

    // Bucket by engaged_at (fallback created_at) so delayed engagements from
    // notification pushes land in the right week/month. See
    // src/lib/engaged-pause.ts#pauseTimestamp.
    const currentRefs = reflections.filter((r) => {
      return isWithinInterval(pauseTimestamp(r), { start: currentStart, end: currentEnd });
    });
    const prevRefs = reflections.filter((r) => {
      return isWithinInterval(pauseTimestamp(r), { start: prevStart, end: prevEnd });
    });

    return { currentRefs, prevRefs, currentLabel, previousLabel };
  }, [reflections, view, t]);

  const current = computeStats(currentRefs);
  const previous = computeStats(prevRefs);

  if (current.count === 0 && previous.count === 0) {
    return (
      <ChartEmptyState
        title={t('periodComparison.title', 'Period Comparison')}
        message={t('periodComparison.emptyMessage', 'Start pausing this week to compare your progress across periods.')}
        current={reflections.length}
        needed={1}
      />
    );
  }

  const metrics = [
    {
      label: t('periodComparison.pauses', 'Pauses'),
      current: current.count,
      previous: previous.count,
      format: (v: number) => `${v}`,
      delta: previous.count > 0 ? current.count - previous.count : null,
      deltaFormat: (d: number) => `${d > 0 ? '+' : ''}${d}`,
    },
    {
      label: t('periodComparison.holdRate', 'Hold rate'),
      current: current.holdRate,
      previous: previous.holdRate,
      format: (v: number) => `${Math.round(v * 100)}%`,
      delta: current.holdRate !== null && previous.holdRate !== null
        ? Math.round((current.holdRate - previous.holdRate) * 100)
        : null,
      deltaFormat: (d: number) => `${d > 0 ? '+' : ''}${d}pp`,
    },
    {
      label: t('periodComparison.calmExits', 'Calm exits'),
      current: current.calmExitRate,
      previous: previous.calmExitRate,
      format: (v: number) => `${Math.round(v * 100)}%`,
      delta: current.calmExitRate !== null && previous.calmExitRate !== null
        ? Math.round((current.calmExitRate - previous.calmExitRate) * 100)
        : null,
      deltaFormat: (d: number) => `${d > 0 ? '+' : ''}${d}pp`,
    },
  ];

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
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

const MetricRow = forwardRef<HTMLDivElement, {
  label: string;
  current: number | null;
  previous: number | null;
  format: (v: number) => string;
  delta: number | null;
  deltaFormat: (d: number) => string;
}>(({ label, current, previous, format: fmt, delta, deltaFormat }, ref) => {
  const DeltaIcon = delta !== null && delta > 0 ? ArrowUpRight : delta !== null && delta < 0 ? ArrowDownRight : Minus;
  const deltaColor = delta !== null && delta > 0
    ? 'text-primary'
    : delta !== null && delta < 0
      ? 'text-destructive'
      : 'text-muted-foreground/40';

  return (
    <div ref={ref} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
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
});

MetricRow.displayName = 'MetricRow';
