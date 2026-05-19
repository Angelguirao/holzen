import { useMemo } from 'react';
import {
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  isHomeSectionAlwaysVisibleInLayout,
} from '@/screens/home/lib/home-section-visibility-constants';

export function useHomeVisibleSections(args: {
  order: string[];
  sectionVisible: Record<string, boolean>;
  subscribed: boolean;
  /** When false, the optional `night` row is hidden from the ordered list. */
  hasNightReflection: boolean;
}) {
  const { order, sectionVisible, subscribed, hasNightReflection } = args;

  const visibleOrderedSectionIds = useMemo(
    () =>
      order.filter((id) => {
        if (isHomeSectionAlwaysVisibleInLayout(id)) return true;
        if (!sectionVisible[id]) return false;
        if (id === 'night' && (!subscribed || !hasNightReflection)) return false;
        return true;
      }),
    [order, sectionVisible, subscribed, hasNightReflection],
  );

  const todaySectionIds = useMemo(
    () => visibleOrderedSectionIds.filter((id) => id !== 'goal-why'),
    [visibleOrderedSectionIds],
  );

  const showJourneyStatTiles = !!sectionVisible[JOURNEY_STAT_TILES_VISIBILITY_ID];

  return { visibleOrderedSectionIds, todaySectionIds, showJourneyStatTiles };
}
