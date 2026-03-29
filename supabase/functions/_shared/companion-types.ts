/**
 * Canonical companion type identifiers.
 *
 * These are the single source of truth for companion type strings used across:
 * - companion_cache.companion_type
 * - companion_serves.companion_type
 * - generation_attempts.companion_type
 * - analytics_events metadata
 * - CompanionFeedback component
 *
 * IMPORTANT: If you add a new companion type, add it here first, then use it everywhere.
 */

/** Companion types as used in the database (companion_cache, companion_serves) */
export const COMPANION_TYPES = {
  /** Philosophical Bitcoin insights from thinkers */
  SIGNAL: "signal",
  /** Behavioral finance grounding nudges */
  GROUNDING: "ground_nudge",
  /** Historical financial parallels */
  HISTORY: "historical_insight",
  /** Deep-time civilizational perspective */
  ZOOM_OUT: "zoom_out",
  /** Deep-time content specifically (used in companion_cache) */
  ZOOM_OUT_DEEP_TIME: "zoom_out_deep_time",
  /** Main reflection message + haiku */
  REFLECTION: "reflection",
  /** Intervention selection result (persisted to avoid regeneration) */
  INTERVENTION: "intervention",
} as const;

export type CompanionType = typeof COMPANION_TYPES[keyof typeof COMPANION_TYPES];

/**
 * Map from orchestrator internal keys to canonical companion types.
 * Used by companion-orchestrate to log to companion_serves.
 */
export const ORCHESTRATOR_KEY_MAP: Record<string, string> = {
  signal: COMPANION_TYPES.SIGNAL,
  grounding: COMPANION_TYPES.GROUNDING,
  history: COMPANION_TYPES.HISTORY,
  zoomOut: COMPANION_TYPES.ZOOM_OUT_DEEP_TIME,
};

/**
 * Map from frontend CompanionFeedback component keys to canonical cache types.
 * Used for feedback → cache quality score correlation.
 */
export const FEEDBACK_CACHE_MAP: Record<string, string> = {
  signal: COMPANION_TYPES.SIGNAL,
  grounding: COMPANION_TYPES.GROUNDING,
  learning: COMPANION_TYPES.GROUNDING,
  zoom_out: COMPANION_TYPES.ZOOM_OUT_DEEP_TIME,
  history_insight: COMPANION_TYPES.HISTORY,
  haiku: "haiku",
};
