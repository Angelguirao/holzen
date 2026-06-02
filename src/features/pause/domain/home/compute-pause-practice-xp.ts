import {
  computePracticeXpBreakdown,
  sumPracticeXpBreakdown,
} from '@/features/pause/domain/practice/compute-practice-xp-breakdown';
import {
  PRACTICE_XP_BRIEF_BASE,
  PRACTICE_XP_DEEP_BASE,
} from '@/features/pause/domain/practice/practice-xp-constants';
import type { HomePracticeStepEventRow } from './build-pause-impact-from-step-events';

/** @deprecated Use {@link PRACTICE_XP_BRIEF_BASE} / {@link PRACTICE_XP_DEEP_BASE}. */
export const PAUSE_PRACTICE_BASE_XP = PRACTICE_XP_BRIEF_BASE;

export type HomePracticePauseInstanceRow = {
  id: string;
  context: string | null;
  metadata?: unknown;
};

export function computePausePracticeXpForInstance(
  events: readonly HomePracticeStepEventRow[],
  _context: string | null,
  engagedTools: number,
  instanceId = 'local',
  instanceMetadata?: unknown,
): number {
  const breakdown = computePracticeXpBreakdown({
    instanceId,
    events,
    engagedTools,
    instanceMetadata,
  });
  return sumPracticeXpBreakdown(breakdown);
}

export function computePresenceXpFromCompletedPauses(
  instances: readonly HomePracticePauseInstanceRow[],
  eventsByInstanceId: ReadonlyMap<string, readonly HomePracticeStepEventRow[]>,
  companionCompleteCounts: ReadonlyMap<string, number>,
): number {
  let total = 0;

  for (const instance of instances) {
    const events = eventsByInstanceId.get(instance.id) ?? [];
    const engagedTools = companionCompleteCounts.get(instance.id) ?? 0;
    total += computePausePracticeXpForInstance(
      events,
      instance.context,
      engagedTools,
      instance.id,
      instance.metadata,
    );
  }

  return total;
}

export { PRACTICE_XP_DEEP_BASE };
