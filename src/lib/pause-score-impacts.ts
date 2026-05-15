import type { TFunction } from 'i18next';
import type { PauseImpactData } from '@/lib/pause-impact-data';

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
}

/** Builds qualitative Journey / skill hints (same rules as `ScoreImpact`). */
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
    });
  } else if (data.mood && data.moodAfter && COMPOSURE[data.moodAfter] > COMPOSURE[data.mood]) {
    list.push({
      label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
      key: 'regulation',
      direction: 'up',
      reason: t('scoreImpact.moodImproved', { defaultValue: 'Mood shifted toward composure' }),
    });
  }

  const vol = parseScoreImpactVolatilityPct(data.context);

  if (vol >= 3 && data.decision === 'held') {
    list.push({
      label: t('holzenScore.distressTolerance', { defaultValue: 'Tolerance' }),
      key: 'tolerance',
      direction: 'up',
      reason: t('scoreImpact.heldVolatility', {
        defaultValue: 'Held steady during {{vol}}% move',
        vol: vol.toFixed(1),
      }),
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
    });
  }

  if (variant === 'brief' && data.decision) {
    const hasRegulation = list.some((i) => i.key === 'regulation');
    const hasTolerance = list.some((i) => i.key === 'tolerance');

    if (data.decision === 'held' && !hasTolerance) {
      list.push({
        label: t('holzenScore.distressTolerance', { defaultValue: 'Tolerance' }),
        key: 'tolerance-brief-held',
        direction: 'up',
        reason:
          vol >= 3
            ? t('scoreImpact.heldVolatility', {
                defaultValue: 'Held steady during {{vol}}% move',
                vol: vol.toFixed(1),
              })
            : t('pause.brief.done.impactHeldCalm', {
                defaultValue:
                  'Choosing to hold adds a steady-outcome signal your Journey uses under distress tolerance.',
              }),
      });
    }

    if (data.decision === 'bought') {
      list.push({
        label: t('holzenScore.distressTolerance', { defaultValue: 'Tolerance' }),
        key: 'brief-bought',
        direction: 'up',
        reason: t('pause.brief.done.impactBought', {
          defaultValue:
            'Buys are scored against volatility context in Journey — this decision updates that pattern.',
        }),
      });
    }

    if (data.decision === 'sold') {
      list.push({
        label: t('holzenScore.distressTolerance', { defaultValue: 'Tolerance' }),
        key: 'brief-sold',
        direction: 'neutral',
        reason: t('pause.brief.done.impactSold', {
          defaultValue:
            'Sells register as realized action; Journey reflects them alongside how calm the window felt.',
        }),
      });
    }

    if (data.mood && !hasRegulation) {
      list.push({
        label: t('holzenScore.emotionalRegulation', { defaultValue: 'Regulation' }),
        key: 'regulation-brief-entry',
        direction: 'up',
        reason: t('pause.brief.done.impactEntryMood', {
          defaultValue:
            'You named how you felt before deciding — that anchors regulation trends when intensity is logged.',
        }),
      });
    }
  }

  return list;
}
