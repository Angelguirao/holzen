import {
  buildPauseImpactFromStepEvents,
  resolveHomePracticeRitualVariant,
  type HomePracticeStepEventRow,
} from './build-pause-impact-from-step-events';
import { sumPauseScoreImpactPoints } from './sum-pause-score-impact-points';

/** Every `state = completed` pause earns at least this much Presence XP. */
export const PAUSE_PRACTICE_BASE_XP = 5;

export type HomePracticePauseInstanceRow = {
  id: string;
  context: string | null;
};

export function computePausePracticeXpForInstance(
  events: readonly HomePracticeStepEventRow[],
  context: string | null,
  engagedTools: number,
): number {
  const impact = buildPauseImpactFromStepEvents(events, context, engagedTools);
  const variant = resolveHomePracticeRitualVariant(events);
  return PAUSE_PRACTICE_BASE_XP + sumPauseScoreImpactPoints(impact, variant);
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
    total += computePausePracticeXpForInstance(events, instance.context, engagedTools);
  }

  return total;
}
