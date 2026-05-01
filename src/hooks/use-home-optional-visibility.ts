import { useCallback, useState } from 'react';

const STORAGE_KEY = 'holzen_home_optional_visible';

/** Fixed Home modules that can be hidden from Home (Customize sheet). */
export const CORE_HOME_SECTION_IDS = ['goal-why', 'market', 'your-pause'] as const;
export type CoreHomeSectionId = (typeof CORE_HOME_SECTION_IDS)[number];

export const OPTIONAL_HOME_WIDGET_IDS = ['journey-pulse', 'quick-capture', 'night'] as const;
export type OptionalHomeWidgetId = (typeof OPTIONAL_HOME_WIDGET_IDS)[number];

export const ALL_HOME_SECTION_IDS = [...CORE_HOME_SECTION_IDS, ...OPTIONAL_HOME_WIDGET_IDS] as const;
export type AllHomeSectionId = (typeof ALL_HOME_SECTION_IDS)[number];

const defaultVisible: Record<string, boolean> = {
  'goal-why': true,
  market: true,
  'your-pause': true,
  'journey-pulse': false,
  'quick-capture': false,
  night: false,
};

function load(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultVisible };
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const next = { ...defaultVisible };
    for (const id of ALL_HOME_SECTION_IDS) {
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
