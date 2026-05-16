import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePauseStatsData } from '@/hooks/use-pause-stats-data';
import { SkillOverviewCard } from '@/components/stats/SkillOverviewCard';
import { MoodShiftChart } from '@/components/stats/regulation/MoodShiftChart';
import { MoodTrendChart } from '@/components/stats/regulation/MoodTrendChart';
import { ReactiveToComposedConversionCard } from '@/components/stats/regulation/ReactiveToComposedConversionCard';
import { VolatilityToleranceCardV2 } from '@/components/stats/tolerance/VolatilityToleranceCard';
import { OutcomeStabilityCard } from '@/components/stats/tolerance/OutcomeStabilityCard';
import { AlignmentCard } from '@/components/stats/alignment/AlignmentCard';
import { PerspectiveToolsImpactCard } from '@/components/stats/reappraisal/PerspectiveToolsImpactCard';
import { AwarenessDepthCard } from '@/components/stats/awareness/AwarenessDepthCard';
import { StreakTimeline } from '@/components/stats/journey/StreakTimeline';
import { MilestoneTimeline } from '@/components/stats/journey/MilestoneTimeline';
import { PeriodComparisonCard } from '@/components/stats/journey/PeriodComparisonCard';
import { MoodPriceChart } from '@/components/stats/advanced/MoodPriceChart';
import { MoodPriceScatter } from '@/components/stats/advanced/MoodPriceScatter';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';
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
 * Skills-first Stats tab per docs/systems/stats-system.md target model.
 *
 * Four sections in order: Skill Overview -> Skill Deep Dives (5) ->
 * Journey & Consistency -> Advanced (collapsed by default).
 *
 * Every card shows formula + denominator + sample size + confidence
 * chip. Alignment falls back to a CTA row when no hold goal exists.
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

      {/* 2. Skill deep dives */}
      <section aria-labelledby="stats-deep-dives" className="space-y-4">
        <h2
          id="stats-deep-dives"
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
        >
          {t('stats.sections.deepDives', { defaultValue: 'Skill deep dives' })}
        </h2>

        <div className="space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
            {t('stats.skills.regulation', { defaultValue: 'Regulation' })}
          </p>
          <ReactiveToComposedConversionCard rows={rows} />
          <MoodShiftChart rows={rows} />
          <MoodTrendChart rows={rows} />
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
            {t('stats.skills.tolerance', { defaultValue: 'Tolerance' })}
          </p>
          <VolatilityToleranceCardV2 rows={rows} />
          <OutcomeStabilityCard rows={rows} />
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
            {t('stats.skills.alignment', { defaultValue: 'Alignment' })}
          </p>
          <AlignmentCard
            rows={rows}
            holdGoal={holdGoal}
            onConfigureHoldGoal={onConfigureHoldGoal}
          />
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
            {t('stats.skills.reappraisal', { defaultValue: 'Reappraisal' })}
          </p>
          <PerspectiveToolsImpactCard rows={rows} />
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">
            {t('stats.skills.awareness', { defaultValue: 'Awareness' })}
          </p>
          <AwarenessDepthCard rows={rows} />
        </div>
      </section>

      {/* 3. Journey & Consistency */}
      <section aria-labelledby="stats-journey" className="space-y-4">
        <h2
          id="stats-journey"
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
        >
          {t('stats.sections.journey', { defaultValue: 'Journey & consistency' })}
        </h2>
        <StreakTimeline rows={rows} />
        <MilestoneTimeline rows={rows} />
        <PeriodComparisonCard rows={rows} />
      </section>

      {/* 4. Advanced (collapsed) */}
      <section aria-labelledby="stats-advanced" className="space-y-3">
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
          <div className="space-y-3 pt-1">
            <MoodPriceChart rows={rows} />
            <MoodPriceScatter rows={rows} />
          </div>
        )}
      </section>
    </div>
  );
}
