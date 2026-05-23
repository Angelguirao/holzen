import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SkillBar } from './SkillBar';
import { TrendChip } from './TrendChip';
import { ConfidenceChip } from './ConfidenceChip';
import {
  sampleConfidence,
  DEFAULT_CONFIDENCE_THRESHOLDS,
} from '@/legacy/full-shell/src/lib/stats/confidence';
import { computePauseScore } from '@/legacy/full-shell/src/lib/stats/pause-score';
import type { PauseFullRow } from '@/legacy/full-shell/src/lib/pause-stats-data-query';
import type { PauseStepEventRow, PauseCompanionEventRow } from '@/features/pause/public';

interface HoldGoal {
  type: string | null;
  targetMonths: number | null;
  targetPrice: number | null;
  start: string | null;
}

interface Props {
  completedRows: readonly PauseFullRow[];
  stepEvents: readonly PauseStepEventRow[];
  companionEvents: readonly PauseCompanionEventRow[];
  holdGoal?: HoldGoal | null;
  onConfigureHoldGoal?: () => void;
}

/**
 * Skills-first hero for the Stats tab. Replaces the old HolzenScoreCard +
 * SkillBalanceCard combo per the "Recommended target model" in
 * docs/systems/stats-system.md.
 *
 * Layout: composite score ring on the left, five skill bars on the right
 * with per-skill trend chips and a single shared confidence chip sourced
 * from the completed-pause sample size.
 *
 * Alignment's "not configured" fallback fires when the user has no hold
 * goal — the bar is replaced by a CTA row instead of showing a synthetic
 * zero or a redistributed score there.
 */
export function SkillOverviewCard({
  completedRows,
  stepEvents,
  companionEvents,
  holdGoal,
  onConfigureHoldGoal,
}: Props) {
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      computePauseScore({
        completedRows,
        stepEvents,
        companionEvents,
        holdGoal,
      }),
    [completedRows, stepEvents, companionEvents, holdGoal],
  );

  if (!data) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('stats.skillOverview.empty', {
            defaultValue: 'Complete a pause to see your skill profile.',
          })}
        </p>
      </div>
    );
  }

  const confidence = sampleConfidence(
    data.sampleSize,
    DEFAULT_CONFIDENCE_THRESHOLDS,
  );
  const hasHoldGoal = holdGoal?.type != null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
            {t('stats.skillOverview.title', { defaultValue: 'Your skill profile' })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {t('stats.skillOverview.windowLabel', {
              defaultValue: 'last {{count}} completed pauses',
              count: data.sampleSize,
            })}
          </p>
        </div>
        <ConfidenceChip
          confidence={confidence}
          sampleSize={data.sampleSize}
          sampleLabel={t('stats.skillOverview.window', {
            defaultValue: 'completed pauses',
          })}
          help={t('stats.skillOverview.confidenceHelp', {
            defaultValue:
              'More completed pauses = more reliable scores. Below 3 we hide the score entirely.',
          })}
        />
      </div>

      {/* Composite ring */}
      <div className="flex items-center gap-6 py-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative h-24 w-24 shrink-0"
          aria-label={t('stats.skillOverview.scoreAria', {
            defaultValue: 'Holzen score {{score}} out of 100',
            score: data.score,
          })}
        >
          <svg viewBox="0 0 36 36" className="h-full w-full">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <motion.path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0, 100' }}
              animate={{ strokeDasharray: `${data.score}, 100` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-semibold tabular-nums">{data.score}</p>
            <TrendChip trend={data.trend} />
          </div>
        </motion.div>

        <div className="flex-1 space-y-3">
          <SkillBar
            label={t('stats.skills.regulation', { defaultValue: 'Regulation' })}
            value={data.emotionalRegulation}
          />
          <SkillBar
            label={t('stats.skills.tolerance', { defaultValue: 'Tolerance' })}
            value={data.distressTolerance}
          />
          {hasHoldGoal ? (
            <SkillBar
              label={t('stats.skills.alignment', { defaultValue: 'Alignment' })}
              value={data.decisionAlignment}
            />
          ) : (
            <SkillBar
              label={t('stats.skills.alignment', { defaultValue: 'Alignment' })}
              value={null}
              notConfigured={{
                message: t('stats.skills.alignmentNotConfigured', {
                  defaultValue:
                    'Set a hold goal to measure how decisions align with your plan.',
                }),
                ctaLabel: onConfigureHoldGoal
                  ? t('stats.skills.alignmentConfigureCta', { defaultValue: 'Set a hold goal' })
                  : undefined,
                onCta: onConfigureHoldGoal,
              }}
            />
          )}
          <SkillBar
            label={t('stats.skills.reappraisal', { defaultValue: 'Reappraisal' })}
            value={data.cognitiveReappraisal}
          />
          <SkillBar
            label={t('stats.skills.awareness', { defaultValue: 'Awareness' })}
            value={data.selfAwareness}
          />
        </div>
      </div>

      <p className="pt-3 text-[10px] leading-relaxed text-muted-foreground">
        {t('stats.skillOverview.footer', {
          defaultValue:
            'Formula: weighted average of five skills. Regulation weighs 30%, Tolerance 25%, Alignment 20% (redistributed when no hold goal), Reappraisal 15%, Awareness 10%.',
        })}
      </p>
    </div>
  );
}
