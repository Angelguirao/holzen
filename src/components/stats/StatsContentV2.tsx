import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePauseStatsData } from '@/hooks/use-pause-stats-data';
import { SkillOverviewCard } from '@/components/stats/SkillOverviewCard';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';
import { cn } from '@/lib/utils';

interface Props {
  holdGoal?: {
    type: string | null;
    targetMonths: number | null;
    targetPrice: number | null;
    start: string | null;
  } | null;
  onConfigureHoldGoal?: () => void;
}

/**
 * Phase G: Skills-first Stats tab fed exclusively by Pause V2 tables.
 *
 * Sections (in order):
 *   1. Skill Overview — hero with composite score + 5 skill bars +
 *      confidence + trend.
 *   2. Skill Deep Dives — one anchor per skill (cards land in subsequent
 *      commits; the section scaffold renders today with placeholder
 *      "coming soon" copy so the section order is stable).
 *   3. Journey & Consistency — streak, milestones, period comparison,
 *      practice activity. Same components as legacy path but fed from
 *      pause rows rather than reflections (adapters land below).
 *   4. Advanced — collapsed by default; mood x price scatter, etc.
 *
 * While `pause_v2_enabled` is false, `usePauseStatsData` returns empty
 * arrays and Profile renders the legacy StatsContent instead of this
 * component — Profile decides which to mount.
 */
export function StatsContentV2({ holdGoal, onConfigureHoldGoal }: Props) {
  const { t } = useTranslation();
  const { ready, rows, stepEvents, companionEvents } = usePauseStatsData();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const completedRows = useMemo<PauseFullRow[]>(
    () => rows.filter((r) => r.state === 'completed'),
    [rows],
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs text-muted-foreground">
          {t('stats.loading', { defaultValue: 'Loading your stats…' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* 1. Skill Overview */}
      <section aria-labelledby="stats-skill-overview">
        <h2
          id="stats-skill-overview"
          className="mb-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
        >
          {t('stats.sections.overview', { defaultValue: 'Skill overview' })}
        </h2>
        <SkillOverviewCard
          completedRows={completedRows}
          stepEvents={stepEvents}
          companionEvents={companionEvents}
          holdGoal={holdGoal}
          onConfigureHoldGoal={onConfigureHoldGoal}
        />
      </section>

      {/* 2. Skill Deep Dives — scaffold for now; cards land in follow-up commits. */}
      <section aria-labelledby="stats-deep-dives" className="space-y-4">
        <h2
          id="stats-deep-dives"
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
        >
          {t('stats.sections.deepDives', { defaultValue: 'Skill deep dives' })}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t('stats.deepDives.coming', {
            defaultValue:
              'Per-skill cards land in the next iteration. Regulation, Tolerance, Alignment, Reappraisal and Awareness each get their own card with formula, denominator, sample size and last-updated window.',
          })}
        </p>
      </section>

      {/* 3. Journey & Consistency — scaffold anchor. */}
      <section aria-labelledby="stats-journey" className="space-y-3">
        <h2
          id="stats-journey"
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
        >
          {t('stats.sections.journey', { defaultValue: 'Journey & consistency' })}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t('stats.journey.coming', {
            defaultValue:
              'Streak, milestones, period comparison and practice activity move here. Same components as before, fed from pause_instances.',
          })}
        </p>
      </section>

      {/* 4. Advanced — collapsed by default. */}
      <section aria-labelledby="stats-advanced">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-left',
            'hover:bg-muted/40 transition-colors',
          )}
          aria-expanded={advancedOpen}
        >
          <span className="text-[10px] font-mono uppercase tracking-widest">
            {t('stats.sections.advanced', { defaultValue: 'Advanced patterns' })}
          </span>
          {advancedOpen ? (
            <ChevronUp className="h-3 w-3" aria-hidden />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden />
          )}
        </button>
        {advancedOpen && (
          <div className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              {t('stats.advanced.coming', {
                defaultValue:
                  'Mood × Price scatter, correlation, and low-confidence charts relocate here by default.',
              })}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
