import { useMemo } from 'react';
import {
  computeShowJourneyStatTiles,
  computeTodaySectionIds,
  computeVisibleOrderedSectionIds,
} from '@/screens/home/lib/compute-home-visible-sections';

export function useHomeVisibleSections(args: {
  order: string[];
  sectionVisible: Record<string, boolean>;
}) {
  const { order, sectionVisible } = args;

  const visibleOrderedSectionIds = useMemo(
    () =>
      computeVisibleOrderedSectionIds({
        order,
        sectionVisible,
      }),
    [order, sectionVisible],
  );

  const todaySectionIds = useMemo(
    () => computeTodaySectionIds(visibleOrderedSectionIds),
    [visibleOrderedSectionIds],
  );

  const showJourneyStatTiles = computeShowJourneyStatTiles(sectionVisible);

  return { visibleOrderedSectionIds, todaySectionIds, showJourneyStatTiles };
}
