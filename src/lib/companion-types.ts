/**
 * Canonical companion type identifiers for the frontend.
 * Must stay in sync with supabase/functions/_shared/companion-types.ts.
 *
 * These are the single source of truth for companion type strings used in:
 * - CompanionFeedback analytics events
 * - Library item source_type values
 * - Companion section card IDs
 */

/** Companion types as stored in the database */
export const COMPANION_TYPES = {
  SIGNAL: "signal",
  GROUNDING: "ground_nudge",
  HISTORY: "historical_insight",
  ZOOM_OUT: "zoom_out",
  ZOOM_OUT_DEEP_TIME: "zoom_out_deep_time",
  REFLECTION: "reflection",
} as const;

/**
 * Map from frontend CompanionFeedback component keys to canonical cache types.
 * The feedback component passes companion_type as the UI key (e.g. "learning"),
 * but the cache uses the canonical type (e.g. "ground_nudge").
 */
export const FEEDBACK_TO_CACHE_TYPE: Record<string, string> = {
  signal: COMPANION_TYPES.SIGNAL,
  learning: COMPANION_TYPES.GROUNDING,
  zoom_out: COMPANION_TYPES.ZOOM_OUT_DEEP_TIME,
  history_insight: COMPANION_TYPES.HISTORY,
  haiku: "haiku",
};
