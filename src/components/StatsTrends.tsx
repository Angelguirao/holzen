import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartEmptyState } from './ChartEmptyState';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { startOfWeek, format } from 'date-fns';
import { filterCompleted, pauseTimestamp } from '@/lib/engaged-pause';

interface Reflection {
  created_at: string;
  engaged_at?: string | null;
  mood: string | null;
  mood_after?: string | null;
  outcome: string | null;
  context?: string | null;
  breathing_completed?: boolean;
  zoom_out_read?: boolean;
  history_read?: boolean;
  signal_read?: boolean;
  grounding_read?: boolean;
  note?: string | null;
  tags?: string[] | null;
}

const COMPOSURE: Record<string, number> = {
  fomo: 10, greedy: 15, anxious: 20, fearful: 25,
  excited: 40, uncertain: 50, detached: 75, calm: 100,
};

function parseVolatility(context: string | null | undefined): number {
  if (!context) return 0;
  const match = context.match(/[↑↓](\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

function volatilityTier(pct: number): number {
  if (pct >= 7) return 2;
  if (pct >= 3) return 1.5;
  return 1;
}

interface WeekBucket {
  key: string;
  label: string;
  score: number;
  holdRate: number;
  highRegulation: number;
  navigated: number;
  lowRegulation: number;
  count: number;
}

function buildWeeklyData(reflections: Reflection[]): WeekBucket[] {
  // Ignored-notification rows (no outcome) are excluded so they never
  // drag down weekly trends.
  const completed = filterCompleted(reflections);
  const buckets = new Map<string, {
    scores: number[];
    held: number; totalOutcomes: number;
    highReg: number; navigatedHigh: number; lowReg: number;
    count: number;
  }>();

  for (const r of completed) {
    // Bucket by engaged_at (when the user actually acted), not created_at
    // (which is the notification insertion time for cron rows). See
    // src/lib/engaged-pause.ts#pauseTimestamp.
    const date = pauseTimestamp(r);
    const key = startOfWeek(date, { weekStartsOn: 1 }).toISOString().slice(0, 10);
    const entry = buckets.get(key) || {
      scores: [],
      held: 0, totalOutcomes: 0,
      highReg: 0, navigatedHigh: 0, lowReg: 0,
      count: 0,
    };

    entry.count++;

    // Skill-based weekly score per reflection
    let refScore = 50; // baseline
    const components: number[] = [];

    // Emotional Regulation component
    if (r.mood && r.mood_after && COMPOSURE[r.mood] !== undefined && COMPOSURE[r.mood_after] !== undefined) {
      const delta = Math.min(100, Math.max(0, 50 + (COMPOSURE[r.mood_after] - COMPOSURE[r.mood])));
      components.push(delta + (r.breathing_completed ? 10 : 0));
    }

    // Distress Tolerance component
    const vol = parseVolatility(r.context);
    if (r.outcome) {
      const tier = volatilityTier(vol);
      if (r.outcome === 'held' || r.outcome === 'nothing') {
        components.push(Math.min(100, 60 + tier * 20));
      } else if (r.outcome === 'sold') {
        components.push(Math.max(0, 40 - tier * 15));
      } else {
        components.push(45);
      }
    }

    // Cognitive Reappraisal component
    const toolsUsed = [r.zoom_out_read, r.history_read, r.signal_read, r.grounding_read].filter(Boolean).length;
    if (toolsUsed > 0) {
      const volMult = vol >= 3 ? 1.5 : 1;
      components.push(Math.min(100, (toolsUsed / 4) * 100 * volMult));
    }

    // Self-Awareness component
    let depth = 0;
    if (r.note && r.note.length > 10) depth += 50;
    if (r.tags && r.tags.length > 0) depth += 30;
    if (r.mood_after) depth += 20;
    if (depth > 0) components.push(Math.min(100, depth));

    if (components.length > 0) {
      refScore = Math.round(components.reduce((a, c) => a + c, 0) / components.length);
    }
    entry.scores.push(Math.max(0, Math.min(100, refScore)));

    // Outcomes
    if (r.outcome) {
      entry.totalOutcomes++;
      if (r.outcome === 'held' || r.outcome === 'nothing') entry.held++;
    }

    // Regulation opportunity tracking
    const moodScore = r.mood ? COMPOSURE[r.mood] ?? 60 : 60;
    if (moodScore <= 30) {
      // High regulation opportunity (reactive mood)
      entry.highReg++;
      // Did they navigate it? (mood improved, held, or used tools)
      const improved = r.mood_after && COMPOSURE[r.mood_after] !== undefined && (COMPOSURE[r.mood_after] ?? 0) > moodScore;
      const heldSteady = r.outcome === 'held' || r.outcome === 'nothing';
      if (improved || heldSteady) entry.navigatedHigh++;
    } else {
      entry.lowReg++;
    }

    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .map(([key, b]) => {
      const score = b.scores.length > 0
        ? Math.round(b.scores.reduce((a, c) => a + c, 0) / b.scores.length)
        : 50;
      const holdRate = b.totalOutcomes > 0 ? Math.round((b.held / b.totalOutcomes) * 100) : 0;
      const totalMoods = b.highReg + b.lowReg;

      return {
        key,
        label: format(new Date(key), 'MMM d'),
        score: Math.max(0, Math.min(100, score)),
        holdRate,
        highRegulation: totalMoods > 0 ? Math.round((b.highReg / totalMoods) * 100) : 0,
        navigated: b.highReg > 0 ? Math.round((b.navigatedHigh / b.highReg) * 100) : 0,
        lowRegulation: totalMoods > 0 ? Math.round((b.lowReg / totalMoods) * 100) : 0,
        count: b.count,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

const tooltipStyle = {
  background: 'hsl(var(--muted))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: '11px',
  fontFamily: 'monospace',
};

interface Props {
  reflections: Reflection[];
}

export function StatsTrends({ reflections }: Props) {
  const { t } = useTranslation();
  const data = useMemo(() => buildWeeklyData(reflections), [reflections]);

  if (data.length < 3) {
    return (
      <ChartEmptyState
        title={t('statsTrends.weeklyTrends')}
        message={t('statsTrends.emptyMessage', 'Pause across 3 separate weeks to see your composure trends over time.')}
        current={data.length}
        needed={3}
      />
    );
  }

  const firstScore = data[0].score;
  const lastScore = data[data.length - 1].score;
  const scoreDelta = lastScore - firstScore;
  const scoreDirection = Math.abs(scoreDelta) < 3 ? 'stable' : scoreDelta > 0 ? 'up' : 'down';

  const firstHold = data[0].holdRate;
  const lastHold = data[data.length - 1].holdRate;
  const holdDelta = lastHold - firstHold;

  // Avg navigation rate for high-regulation moments
  const avgNavRate = (() => {
    const withHigh = data.filter(d => d.highRegulation > 0);
    if (withHigh.length === 0) return null;
    return Math.round(withHigh.reduce((s, d) => s + d.navigated, 0) / withHigh.length);
  })();

  return (
    <div className="space-y-5">
      {/* Holzen Score over time */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
            {t('statsTrends.scoreOverTime')}
          </p>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${
            scoreDirection === 'up' ? 'text-primary' : scoreDirection === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {scoreDirection === 'up' ? `+${scoreDelta}` : scoreDirection === 'down' ? `${scoreDelta}` : t('statsTrends.stable')}
          </span>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}`, t('statsTrends.score')]} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground/40">
          {t('statsTrends.weeklySkillScore', 'Skill-weighted weekly score across {{count}} pauses', { count: data.reduce((s, d) => s + d.count, 0) })}
        </p>
      </div>

      {/* Regulation Opportunity */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
            {t('statsTrends.regulationOpportunity', 'Regulation Opportunity')}
          </p>
          {avgNavRate !== null && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 text-primary">
              {t('statsTrends.navigatedRate', '{{rate}}% navigated', { rate: avgNavRate })}
            </span>
          )}
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => {
                  const label = name === 'highRegulation'
                    ? t('statsTrends.highRegulation', 'High regulation')
                    : t('statsTrends.lowRegulation', 'Low regulation');
                  return [`${Math.round(v * 100)}%`, label];
                }}
              />
              <Area type="monotone" dataKey="lowRegulation" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
              <Area type="monotone" dataKey="highRegulation" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/50">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/40" />{t('statsTrends.highRegulation', 'High regulation needed')}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60" />{t('statsTrends.lowRegulation', 'Low regulation needed')}</span>
        </div>
        <p className="text-[10px] text-muted-foreground/40">
          {t('statsTrends.regulationDesc', 'Shows how often you faced reactive emotions — and how often you navigated them successfully.')}
        </p>
      </div>

      {/* Hold rate over time */}
      <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
            {t('statsTrends.holdRate')}
          </p>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 ${
            holdDelta > 5 ? 'text-primary' : holdDelta < -5 ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {holdDelta > 0 ? `+${holdDelta}%` : `${holdDelta}%`}
          </span>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, t('statsTrends.holdRate')]} />
              <Line
                type="monotone"
                dataKey="holdRate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground/40">
          {t('statsTrends.holdRateDescription')}
        </p>
      </div>
    </div>
  );
}
