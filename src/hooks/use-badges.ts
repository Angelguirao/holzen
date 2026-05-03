/**
 * V2 badge loader: pure memo over the shared `usePauseStatsData` hook.
 * Returns the full snapshot + the array of earned ids + metadata map
 * that `useBadgeSync` needs. Component consumers read the snapshot
 * directly to render.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { computeBadges, type BadgeSnapshot } from '@/lib/badges/compute';
import type { PauseFullRow } from '@/hooks/use-pause-stats-data';
import type { PauseStepEventRow, PauseCompanionEventRow } from '@/lib/pause-state';

interface HoldGoal {
  type: string | null;
}

export interface UseBadgesParams {
  rows: readonly PauseFullRow[];
  stepEvents: readonly PauseStepEventRow[];
  companionEvents: readonly PauseCompanionEventRow[];
  holdGoal?: HoldGoal | null;
  trackedAssetId?: string | null;
}

export interface UseBadgesResult {
  snapshots: BadgeSnapshot[];
  earnedIds: string[];
  badgeMeta: Record<string, { label: string; description: string; color: string }>;
}

export function useBadges({
  rows,
  stepEvents,
  companionEvents,
  holdGoal,
  trackedAssetId,
}: UseBadgesParams): UseBadgesResult {
  const { t } = useTranslation();
  return useMemo(() => {
    const completedRows = rows.filter((r) => r.state === 'completed');
    const snapshots = computeBadges({
      completedRows,
      stepEvents,
      companionEvents,
      holdGoal,
      trackedAssetId: trackedAssetId ?? 'bitcoin',
    });
    const earnedIds = snapshots.filter((s) => s.earned).map((s) => s.id);
    const badgeMeta: Record<string, { label: string; description: string; color: string }> = {};
    for (const s of snapshots) {
      if (s.earned) {
        badgeMeta[s.id] = {
          label: t(s.labelKey, { defaultValue: s.id }),
          description: t(s.descKey, { defaultValue: '' }),
          color: s.color,
        };
      }
    }
    return { snapshots, earnedIds, badgeMeta };
  }, [rows, stepEvents, companionEvents, holdGoal, trackedAssetId, t]);
}
