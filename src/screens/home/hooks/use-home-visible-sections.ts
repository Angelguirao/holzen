import { useMemo } from 'react';
import {
  computeShowJourneyStatTiles,
  computeTodaySectionIds,
  computeVisibleOrderedSectionIds,
} from '@/screens/home/lib/compute-home-visible-sections';

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
      computeVisibleOrderedSectionIds({
        order,
        sectionVisible,
        subscribed,
        hasNightReflection,
      }),
    [order, sectionVisible, subscribed, hasNightReflection],
  );

  const todaySectionIds = useMemo(
    () => computeTodaySectionIds(visibleOrderedSectionIds),
    [visibleOrderedSectionIds],
  );

  const showJourneyStatTiles = computeShowJourneyStatTiles(sectionVisible);

  return { visibleOrderedSectionIds, todaySectionIds, showJourneyStatTiles };
}
