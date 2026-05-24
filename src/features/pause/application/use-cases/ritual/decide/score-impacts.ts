import type { TFunction } from 'i18next';
import type { PauseImpactData } from './impact-data';

const COMPOSURE: Record<string, number> = {
  fomo: 10,
  greedy: 15,
  anxious: 20,
  fearful: 25,
  excited: 40,
  uncertain: 50,
  detached: 75,
  calm: 100,
};

export function parseScoreImpactVolatilityPct(context: string | null): number {
  if (!context) return 0;
  const match = context.match(/[↑↓](\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

export interface PauseScoreImpactRow {
  key: string;
  label: string;
  direction: 'up' | 'neutral';
  reason: string;
  /** Optional numeric weight used by older UI; not rendered in `ScoreImpact` (brief and default use reasons only). */
  points: number;
}

/** Builds qualitative pause-practice hints for the Done screen (process, not trade judgment). */
export function buildPauseScoreImpacts(
  data: PauseImpactData,
  t: TFunction,
  variant: 'default' | 'brief',
): PauseScoreImpactRow[] {
  const list: PauseScoreImpactRow[] = [];

  if (data.breathingCompleted) {
    list.push({
      label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
      key: 'regulation',
      direction: 'up',
      reason: t('scoreImpact.breathing', { defaultValue: 'Breathing completed' }),
      points: 4,
    });
  } else if (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]) {
    list.push({
      label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
      key: 'regulation',
      direction: 'up',
      reason: t('scoreImpact.moodImproved', { defaultValue: 'Mood shifted toward composure' }),
      points: 5,
    });
  }

  if (data.engagedTools > 0) {
    list.push({
      label: t('holzenScore.cognitiveReappraisal', { defaultValue: 'Reappraisal' }),
      key: 'reappraisal',
      direction: 'up',
      reason: t('scoreImpact.tools', {
        defaultValue: 'Used {{count}} perspective tool(s)',
        count: data.engagedTools,
      }),
      points: Math.min(6, 2 * data.engagedTools),
    });
  }

  if (data.wroteNote || data.usedTags) {
    list.push({
      label: t('holzenScore.selfAwareness', { defaultValue: 'Awareness' }),
      key: 'awareness',
      direction: 'up',
      reason: data.wroteNote
        ? t('scoreImpact.note', { defaultValue: 'Added a reflection note' })
        : t('scoreImpact.tags', { defaultValue: 'Tagged this pause' }),
      points: 3,
    });
  }

  if (variant === 'brief' && data.decision) {
    const hasRegulation = list.some((i) => i.key === 'regulation');

    list.push({
      label: t('holzenScore.selfAwareness', { defaultValue: 'Awareness' }),
      key: 'decision-recorded',
      direction: 'up',
      reason: t('pause.brief.done.impactDecisionRecorded', {
        defaultValue: 'You recorded what you chose after pausing — that is the practice.',
      }),
      points: 2,
    });

    if (data.mood && !hasRegulation) {
      list.push({
        label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
        key: 'regulation-brief-entry',
        direction: 'up',
        reason: t('pause.brief.done.impactEntryMood', {
          defaultValue: 'You named how you felt before deciding.',
        }),
        points: 2,
      });
    }
  }

  return list;
}
