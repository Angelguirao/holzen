import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  renderHomeDashboardSection,
  type HomeDashboardSectionDeps,
} from '@/components/home/render-home-dashboard-section';

export function useHomeDashboardSectionRenderers(
  sectionDeps: HomeDashboardSectionDeps,
  visibleOrderedSectionIds: string[],
) {
  const renderSection = useCallback(
    (sectionId: string) => renderHomeDashboardSection(sectionId, sectionDeps),
    [sectionDeps],
  );

  const goalWhyBlock: ReactNode | null = useMemo(() => {
    if (!visibleOrderedSectionIds.includes('goal-why')) return null;
    return renderHomeDashboardSection('goal-why', sectionDeps);
  }, [visibleOrderedSectionIds, sectionDeps]);

  return { renderSection, goalWhyBlock };
}
