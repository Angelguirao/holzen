import { useCallback, useState } from 'react';
import {
  defaultHomeOptionalVisibility,
  HOME_OPTIONAL_VISIBILITY_STORAGE_KEY,
  loadHomeOptionalVisibility,
} from '@/screens/home/lib/home-optional-visibility-storage';

export {
  ALL_HOME_SECTION_IDS,
  HOME_WIDGET_DEFAULT_ORDER,
  HOME_SECTION_IDS_WITHOUT_VISIBILITY_TOGGLE,
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  OPTIONAL_HOME_WIDGET_IDS,
  isHomeSectionAlwaysVisibleInLayout,
  type AllHomeSectionId,
  type HomeSectionIdWithoutVisibilityToggle,
  type OptionalHomeWidgetId,
} from '@/screens/home/lib/home-section-visibility-constants';

export function useHomeOptionalVisibility() {
  const [visible, setVisibleState] = useState<Record<string, boolean>>(loadHomeOptionalVisibility);

  const setVisible = useCallback((id: string, value: boolean) => {
    setVisibleState((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(HOME_OPTIONAL_VISIBILITY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetVisibility = useCallback(() => {
    setVisibleState({ ...defaultHomeOptionalVisibility });
    localStorage.removeItem(HOME_OPTIONAL_VISIBILITY_STORAGE_KEY);
  }, []);

  return { visible, setVisible, resetVisibility };
}
