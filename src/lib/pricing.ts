/**
 * Single source of truth for pricing.
 * Change the price here and it propagates everywhere via i18next interpolation.
 */
export const PRICING = {
  /** Monthly price in USD */
  monthlyPrice: 5,
  /** Number of free reflections before paywall */
  freeReflections: 3,
} as const;
