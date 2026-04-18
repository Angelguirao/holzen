export type RegenerateCompanionSlot = 'signal' | 'grounding' | 'history' | 'zoomOut';

/** Mirrors Edge `CacheServeRelaxation` when surfaced to the client. */
export type CompanionCacheRelaxation = 'none' | 'market' | 'repeat_or_lower_quality';

export interface InterventionPrimary {
  type: 'mirror' | 'pattern' | 'trap';
  data: any;
}

export interface InterventionSecondary {
  type: 'zoom_out';
  data: any;
}

export interface InterventionState {
  mode: 'insight' | 'question';
  primary: InterventionPrimary | null;
  secondary: InterventionSecondary | null;
  question: string | null;
}

/** Where a slot result came from. `library` = served from the curated `content_library` table (distinct from
 *  the runtime `companion_cache`). Keep aligned with edge `CompanionResultSource` and `companion_serves.serve_source`. */
export type CompanionSlotSource = 'live' | 'library' | 'cache' | 'curated' | 'empty';

/** Slot payload shape returned by `companion-orchestrate` for each companion key. */
export interface CompanionOrchestrateSlotResult {
  data: any | null;
  source: CompanionSlotSource;
  cacheId: string | null;
  /** From `serveFromCache` — `none` is a strict companion_cache hit. */
  cacheRelaxation?: CompanionCacheRelaxation | null;
  latencyMs: number;
  error?: string;
}
