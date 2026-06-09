import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import { estimatePresenceXpFromImpact } from '@/features/pause/domain/done/estimate-presence-xp-from-impact';
import {
  formatPauseDoneDecisionLabel,
  formatPauseDoneEndedShiftLine,
  formatPauseDoneMoodIntensityLine,
} from '@/features/pause/domain/done/format-pause-done-summary-labels';
import { formatPauseRitualDurationMs } from '@/features/pause/domain/done/format-pause-ritual-duration';
import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
import { clampFeelIntensity, type MoodValue } from '@/features/pause/domain/mood-value';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';
import { PauseDoneSummaryRow } from '@/screens/pause/components/pause-done-summary-row';

const FRAME_COMPANION_SLOTS = ['haiku', 'grounding', 'signal', 'zoomOut', 'history'] as const;

function enabledFrameCompanionSlots(prefs: CompanionPrefs | null | undefined): string[] {
  if (!prefs) return [];
  return FRAME_COMPANION_SLOTS.filter((slot) => prefs[slot as keyof CompanionPrefs]);
}

export type PauseDoneSummaryCardProps = {
  pauseData: PauseImpactData;
  /** Brief check-in: optional post-decide mood shift row. */
  endedMood?: MoodValue | null;
  endedIntensity?: number | null;
};

/** Figma Done summary card — Started, Time, Frame, Choice, Presence (+ optional Ended). */
export function PauseDoneSummaryCard({ pauseData, endedMood, endedIntensity }: PauseDoneSummaryCardProps) {
  "use memo";
  const { t } = useTranslation();

  const startedLine = useMemo(
    () => formatPauseDoneMoodIntensityLine(pauseData.mood, pauseData.feelIntensity, t),
    [pauseData.mood, pauseData.feelIntensity, t],
  );
  const timeLine = useMemo(
    () => formatPauseRitualDurationMs(pauseData.ritualDurationMs),
    [pauseData.ritualDurationMs],
  );
  const choiceLine = useMemo(
    () => formatPauseDoneDecisionLabel(pauseData.decision, t),
    [pauseData.decision, t],
  );
  const presenceXp = useMemo(() => estimatePresenceXpFromImpact(pauseData), [pauseData]);
  const frameSlots = useMemo(
    () => enabledFrameCompanionSlots(pauseData.companionPrefs),
    [pauseData.companionPrefs],
  );

  const endedLine = useMemo(() => {
    if (endedMood == null && endedIntensity == null) return null;
    const startIntensity = clampFeelIntensity(pauseData.feelIntensity ?? null);
    const endIntensity = clampFeelIntensity(endedIntensity ?? pauseData.feelIntensity ?? null);
    const endMood = endedMood ?? pauseData.mood;
    if (
      endMood === pauseData.mood &&
      endIntensity === startIntensity
    ) {
      return null;
    }
    return formatPauseDoneEndedShiftLine({
      startMood: pauseData.mood,
      startIntensity: pauseData.feelIntensity,
      endMood,
      endIntensity,
      t,
    });
  }, [endedMood, endedIntensity, pauseData.mood, pauseData.feelIntensity, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      className="w-full max-w-md rounded-xl border border-primary bg-muted/30 p-4 text-left"
    >
      <div className="space-y-3">
        {startedLine ? (
          <PauseDoneSummaryRow label={t('pause.done.summary.started')}>{startedLine}</PauseDoneSummaryRow>
        ) : null}
        {timeLine ? (
          <PauseDoneSummaryRow label={t('pause.done.summary.time')}>{timeLine}</PauseDoneSummaryRow>
        ) : null}
        {frameSlots.length > 0 ? (
          <PauseDoneSummaryRow label={t('pause.done.summary.frame')}>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {frameSlots.map((slot) => {
                const Icon = COMPANION_SECTION_ICONS[slot];
                if (!Icon) return null;
                return <Icon key={slot} className="h-4 w-4 text-foreground" aria-hidden />;
              })}
            </div>
          </PauseDoneSummaryRow>
        ) : null}
        {choiceLine ? (
          <PauseDoneSummaryRow label={t('pause.done.summary.choice')}>{choiceLine}</PauseDoneSummaryRow>
        ) : null}
        <PauseDoneSummaryRow label={t('pause.done.summary.presence')}>
          {t('pause.done.summary.presenceXp', { count: presenceXp })}
        </PauseDoneSummaryRow>
        {endedLine ? (
          <PauseDoneSummaryRow label={t('pause.done.summary.ended')}>{endedLine}</PauseDoneSummaryRow>
        ) : null}
      </div>
    </motion.div>
  );
}
