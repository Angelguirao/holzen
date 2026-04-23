/**
 * Sample-size confidence for Stats cards.
 *
 * Most per-card metrics are noisy below small N. The target model
 * (docs/systems/stats-system.md "Recommended target model") calls for
 * each card to show a confidence chip + optional "hide/gray below
 * minimum". This module provides the single threshold function every
 * card uses so the labels stay consistent.
 */

export type Confidence = 'high' | 'medium' | 'low' | 'insufficient';

export interface ConfidenceThresholds {
  /** Minimum sample size for 'low' confidence. Below -> 'insufficient'. */
  minLow: number;
  /** Threshold for 'medium' confidence (inclusive lower bound). */
  minMedium: number;
  /** Threshold for 'high' confidence (inclusive lower bound). */
  minHigh: number;
}

/** Default thresholds work for most pause-count-denominated metrics. */
export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  minLow: 3,
  minMedium: 10,
  minHigh: 20,
};

export function sampleConfidence(
  sample: number,
  thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS,
): Confidence {
  if (sample >= thresholds.minHigh) return 'high';
  if (sample >= thresholds.minMedium) return 'medium';
  if (sample >= thresholds.minLow) return 'low';
  return 'insufficient';
}

/** Human-readable copy for each confidence tier. Keep i18n in the chip. */
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  insufficient: 'Not enough data yet',
};
