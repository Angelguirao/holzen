/**
 * Canonical companion type identifiers for the frontend.
 * Must stay in sync with supabase/functions/_shared/companion-types.ts.
 */
export const COMPANION_TYPES = {
  SIGNAL: 'signal',
  GROUNDING: 'ground_nudge',
  HISTORY: 'historical_insight',
  ZOOM_OUT: 'zoom_out',
  ZOOM_OUT_DEEP_TIME: 'zoom_out_deep_time',
  REFLECTION: 'reflection',
  INTERVENTION: 'intervention',
} as const;

/** Map from CompanionFeedback component keys to canonical cache types. */
export const FEEDBACK_TO_CACHE_TYPE: Record<string, string> = {
  signal: COMPANION_TYPES.SIGNAL,
  grounding: COMPANION_TYPES.GROUNDING,
  learning: COMPANION_TYPES.GROUNDING,
  zoom_out: COMPANION_TYPES.ZOOM_OUT,
  history_insight: COMPANION_TYPES.HISTORY,
  haiku: 'haiku',
};
