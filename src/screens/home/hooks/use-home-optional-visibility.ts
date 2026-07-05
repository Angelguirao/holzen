import { useCallback, useEffect, useState } from 'react';
import {
  clearHomeOptionalVisibility,
  defaultHomeOptionalVisibility,
  loadHomeOptionalVisibility,
  saveHomeOptionalVisibility,
} from '@/screens/home/lib/home-layout-storage';

export {
  ALL_HOME_SECTION_IDS,
  HOME_WIDGET_DEFAULT_ORDER,
  HOME_SECTION_IDS_WITHOUT_VISIBILITY_TOGGLE,
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  LEGACY_HOME_SECTION_IDS,
  isHomeSectionAlwaysVisibleInLayout,
  isLegacyHomeSectionId,
  type AllHomeSectionId,
  type HomeSectionIdWithoutVisibilityToggle,
  type LegacyHomeSectionId,
} from '@/screens/home/lib/home-section-visibility-constants';

export function useHomeOptionalVisibility(userId: string | undefined) {
  const [visible, setVisibleState] = useState<Record<string, boolean>>(() =>
    loadHomeOptionalVisibility(userId),
  );

  useEffect(() => {
    setVisibleState(loadHomeOptionalVisibility(userId));
  }, [userId]);

  const setVisible = useCallback(
    (id: string, value: boolean) => {
      setVisibleState((prev) => {
        const next = { ...prev, [id]: value };
        saveHomeOptionalVisibility(userId, next);
        return next;
      });
    },
    [userId],
  );

  const resetVisibility = useCallback(() => {
    setVisibleState({ ...defaultHomeOptionalVisibility });
    clearHomeOptionalVisibility(userId);
  }, [userId]);

  return { visible, setVisible, resetVisibility };
}
