import {
  JOURNEY_STAT_TILES_VISIBILITY_ID,
  OPTIONAL_HOME_WIDGET_IDS,
} from '@/screens/home/lib/home-section-visibility-constants';

export const HOME_OPTIONAL_VISIBILITY_STORAGE_KEY = 'holzen_home_optional_visible';

const VISIBILITY_KEYS = [...OPTIONAL_HOME_WIDGET_IDS, JOURNEY_STAT_TILES_VISIBILITY_ID] as const;

export const defaultHomeOptionalVisibility: Record<string, boolean> = {
  [JOURNEY_STAT_TILES_VISIBILITY_ID]: true,
  'quick-capture': false,
  night: false,
};

/** Load optional Home widget visibility from localStorage (falls back to defaults). */
export function loadHomeOptionalVisibility(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(HOME_OPTIONAL_VISIBILITY_STORAGE_KEY);
    if (!raw) return { ...defaultHomeOptionalVisibility };
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const next = { ...defaultHomeOptionalVisibility };
    for (const id of VISIBILITY_KEYS) {
      if (typeof parsed[id] === 'boolean') next[id] = parsed[id];
    }
    return next;
  } catch {
    return { ...defaultHomeOptionalVisibility };
  }
}
