import { useMemo } from 'react';
import type { HomeDashboardLayoutProps } from '@/components/home/HomeDashboardLayout';

/** Stable props object for {@link HomeDashboardLayout} (avoids a fresh inline object every render). */
export function useHomeDashboardLayoutProps(p: HomeDashboardLayoutProps): HomeDashboardLayoutProps {
  return useMemo(
    () => ({
      pullHandlers: p.pullHandlers,
      pullDistance: p.pullDistance,
      pullRefreshing: p.pullRefreshing,
      userId: p.userId,
      firstName: p.firstName,
      todaySectionIds: p.todaySectionIds,
      goalWhyBlock: p.goalWhyBlock,
      renderSection: p.renderSection,
      onOpenCustomize: p.onOpenCustomize,
      customize: p.customize,
      completedPauseCount: p.completedPauseCount,
    }),
    [
      p.pullHandlers,
      p.pullDistance,
      p.pullRefreshing,
      p.userId,
      p.firstName,
      p.todaySectionIds,
      p.goalWhyBlock,
      p.renderSection,
      p.onOpenCustomize,
      p.customize,
      p.completedPauseCount,
    ],
  );
}
