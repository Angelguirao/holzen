/** Inline companion card payload (haiku from reflect; grounding uses lazy slot + artifacts). */
export interface CompanionData {
  haiku: string | null;
  /** Legacy session field from reflect fetch — not read by Frame companion strip. */
  groundingTitle: string | null;
  /** Legacy session field from reflect fetch — not read by Frame companion strip. */
  groundingBody: string | null;
}

export interface CompanionPrefs {
  breathing: boolean;
  haiku: boolean;
  /** Ground companion card; persisted as `profiles.companion_grounding`. */
  grounding: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}
