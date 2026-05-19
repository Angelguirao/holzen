/** Inline companion card payload (haiku + grounding stubs from pause instance). */
export interface CompanionData {
  haiku: string | null;
  groundingTitle: string | null;
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
