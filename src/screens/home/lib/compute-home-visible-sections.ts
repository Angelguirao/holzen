import {
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  isHomeSectionAlwaysVisibleInLayout,
} from '@/screens/home/lib/home-section-visibility-constants';

export function computeVisibleOrderedSectionIds(args: {
  order: string[];
  sectionVisible: Record<string, boolean>;
  subscribed: boolean;
  hasNightReflection: boolean;
}): string[] {
  const { order, sectionVisible, subscribed, hasNightReflection } = args;
  return order.filter((id) => {
    if (isHomeSectionAlwaysVisibleInLayout(id)) return true;
    if (!sectionVisible[id]) return false;
    if (id === 'night' && (!subscribed || !hasNightReflection)) return false;
    return true;
  });
}

export function computeTodaySectionIds(visibleOrderedSectionIds: string[]): string[] {
  return visibleOrderedSectionIds.filter((id) => id !== 'goal-why');
}

export function computeShowJourneyStatTiles(sectionVisible: Record<string, boolean>): boolean {
  return !!sectionVisible[JOURNEY_STAT_TILES_VISIBILITY_ID];
}
