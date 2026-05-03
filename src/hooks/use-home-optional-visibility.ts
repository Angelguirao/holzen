import { useCallback, useState } from 'react';

const STORAGE_KEY = 'holzen_home_optional_visible';

export const OPTIONAL_HOME_WIDGET_IDS = ['quick-capture', 'night'] as const;
export type OptionalHomeWidgetId = (typeof OPTIONAL_HOME_WIDGET_IDS)[number];

/** Shown on Home whenever present in layout order; Customize sheet has no on/off row (wireframe). */
export const HOME_SECTION_IDS_WITHOUT_VISIBILITY_TOGGLE = ['market', 'your-pause', 'goal-why'] as const;
export type HomeSectionIdWithoutVisibilityToggle =
  (typeof HOME_SECTION_IDS_WITHOUT_VISIBILITY_TOGGLE)[number];

/**
 * Default Home section order (Hold mode + Customize). `goal-why` is pinned first; the rest
 * reorder in Customize (DnD). `normalizeHomeSectionOrder` merges defaults and keeps tail order.
 * `journey-pulse` is the Holzen score / In motion row (`HomeStatTiles`).
 */
export const ALL_HOME_SECTION_IDS = [
  'goal-why',
  'night',
  'market',
  'your-pause',
  'journey-pulse',
  'quick-capture',
] as const;
export type AllHomeSectionId = (typeof ALL_HOME_SECTION_IDS)[number];

/**
 * Stable default order for {@link useWidgetLayout} (copy of `ALL_HOME_SECTION_IDS`).
 * Pass this reference as `defaultOrder` so `reorder` / `resetLayout` deps stay stable.
 */
export const HOME_WIDGET_DEFAULT_ORDER: string[] = [...ALL_HOME_SECTION_IDS];

/** Layout + visibility id for the Holzen score + In motion row (`HomeStatTiles`). */
export const JOURNEY_STAT_TILES_VISIBILITY_ID = 'journey-pulse' as const;

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

export function isHomeSectionAlwaysVisibleInLayout(id: string): boolean {
  return (HOME_SECTION_IDS_WITHOUT_VISIBILITY_TOGGLE as readonly string[]).includes(id);
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
