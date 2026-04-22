/**
 * Single source of truth for pricing & feature gating.
 * Change values here and they propagate everywhere via i18next interpolation.
 */
export const PRICING = {
  /** Monthly price in USD */
  monthlyPrice: 4.99,
  /** Pro+ monthly price in USD */
  proPlusMonthlyPrice: 9.99,
  /** Number of free reflections per month */
  freeReflectionsPerMonth: 3,
  /** Free trial duration in days */
  trialDays: 7,
  /** Included premium companion unlocks per month */
  proCompanionUnlocks: 12,
  proPlusCompanionUnlocks: 30,
  /** Included wallpaper generations per month */
  proWallpapers: 5,
  proPlusWallpapers: 15,
  /** Flex credit packs */
  flexPackSCredits: 30,
  flexPackMCredits: 55,
} as const;

/** Features that require a Pro subscription */
export const PRO_FEATURES = [
  'haiku',
  'signal',
  'zoom_out',
  'history',
  'ground_companion',
  'ai_insights',
  'night_reflections',
  
  'library',
  'letters',
  'wallpapers',
  'nudges',
] as const;

export type ProFeature = typeof PRO_FEATURES[number];
