import { useHomeDashboardSectionDeps } from '@/hooks/use-home-dashboard-section-deps';
import { useHomeDashboardSectionRenderers } from '@/hooks/use-home-dashboard-section-renderers';

/**
 * Memoized `HomeDashboardSectionDeps` plus `renderSection` / `goalWhyBlock`
 * for the non-Zen “Today” stack.
 */
export function useHomeDashboardTodayWiring(
  depsArgs: Parameters<typeof useHomeDashboardSectionDeps>[0],
  visibleOrderedSectionIds: string[],
) {
  const sectionDeps = useHomeDashboardSectionDeps(depsArgs);
  return useHomeDashboardSectionRenderers(sectionDeps, visibleOrderedSectionIds);
}
