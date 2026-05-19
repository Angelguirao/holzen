/**
 * Home layout section ids + visibility toggles (Customize sheet).
 * Shared by home-order normalization, copy helpers, and optional visibility hook.
 */

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

export function isHomeSectionAlwaysVisibleInLayout(id: string): boolean {
  return (HOME_SECTION_IDS_WITHOUT_VISIBILITY_TOGGLE as readonly string[]).includes(id);
}
