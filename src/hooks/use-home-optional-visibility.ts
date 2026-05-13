import { useCallback, useState } from 'react';
import {
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  OPTIONAL_HOME_WIDGET_IDS,
} from '@/lib/home-section-visibility-constants';

const STORAGE_KEY = 'holzen_home_optional_visible';

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
} from '@/lib/home-section-visibility-constants';

const VISIBILITY_KEYS = [...OPTIONAL_HOME_WIDGET_IDS, JOURNEY_STAT_TILES_VISIBILITY_ID] as const;

const defaultVisible: Record<string, boolean> = {
  [JOURNEY_STAT_TILES_VISIBILITY_ID]: true,
  'quick-capture': false,
  night: false,
};

function load(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultVisible };
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const next = { ...defaultVisible };
    for (const id of VISIBILITY_KEYS) {
      if (typeof parsed[id] === 'boolean') next[id] = parsed[id];
    }
    return next;
  } catch {
    return { ...defaultVisible };
  }
}

export function useHomeOptionalVisibility() {
  const [visible, setVisibleState] = useState<Record<string, boolean>>(load);

  const setVisible = useCallback((id: string, value: boolean) => {
    setVisibleState((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetVisibility = useCallback(() => {
    setVisibleState({ ...defaultVisible });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { visible, setVisible, resetVisibility };
}
