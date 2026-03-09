/**
 * Single source of truth for pricing & feature gating.
 * Change values here and they propagate everywhere via i18next interpolation.
 */
export const PRICING = {
  /** Monthly price in USD */
  monthlyPrice: 5,
  /** Number of free reflections per month */
  freeReflectionsPerMonth: 3,
} as const;

/** Features that require a Pro subscription */
export const PRO_FEATURES = [
  'haiku',
  'signal',
  'zoom_out',
  'history',
  'learning',
  'ai_insights',
  'night_reflections',
  'rituals',
  'library',
  'letters',
  'wallpapers',
  'nudges',
] as const;

export type ProFeature = typeof PRO_FEATURES[number];
