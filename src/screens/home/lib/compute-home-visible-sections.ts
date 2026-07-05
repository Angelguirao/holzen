import {
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  isHomeSectionAlwaysVisibleInLayout,
} from '@/screens/home/lib/home-section-visibility-constants';

export function computeVisibleOrderedSectionIds(args: {
  order: string[];
  sectionVisible: Record<string, boolean>;
}): string[] {
  const { order, sectionVisible } = args;
  return order.filter((id) => {
    if (isHomeSectionAlwaysVisibleInLayout(id)) return true;
    if (!sectionVisible[id]) return false;
    return true;
  });
}

export function computeTodaySectionIds(visibleOrderedSectionIds: string[]): string[] {
  return visibleOrderedSectionIds.filter((id) => id !== 'goal-why');
}

export function computeShowJourneyStatTiles(sectionVisible: Record<string, boolean>): boolean {
  return !!sectionVisible[JOURNEY_STAT_TILES_VISIBILITY_ID];
}
