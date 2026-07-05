/** Inline companion payload on the pause session (haiku from reflect; other slots use artifacts + orchestrate). */
export interface CompanionData {
  haiku: string | null;
}

/** Strip removed session fields when loading legacy persisted / router payloads. */
export function normalizeCompanionData(companions: unknown): CompanionData {
  if (!companions || typeof companions !== 'object') return { haiku: null };
  const haiku = (companions as { haiku?: unknown }).haiku;
  return { haiku: haiku === null || typeof haiku === 'string' ? haiku : null };
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
