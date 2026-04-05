/** `reflections` column set when user completes a ritual step (breathing / haiku). */
export const COMPANION_STEP_TO_REFLECTION_COLUMN: Record<string, string> = {
  breathing: 'breathing_completed',
  haiku: 'haiku_read',
};

/**
 * `reflection_companions.companion_type` for marking read.
 * Zoom uses two DB types; see `markCompleted` in use-companion-data.
 */
export const COMPANION_STEP_TO_READ_TYPE: Record<string, string> = {
  signal: 'signal',
  grounding: 'ground_nudge',
  zoomOut: 'zoom_out_deep_time',
  history: 'historical_insight',
};
