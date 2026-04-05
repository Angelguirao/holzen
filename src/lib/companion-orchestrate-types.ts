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

/** Slot payload shape returned by `companion-orchestrate` for each companion key. */
export interface CompanionOrchestrateSlotResult {
  data: any | null;
  source: 'live' | 'cache' | 'curated' | 'empty';
  cacheId: string | null;
  /** From `serveFromCache` — `none` is a strict companion_cache hit. */
  cacheRelaxation?: CompanionCacheRelaxation | null;
  latencyMs: number;
  error?: string;
}
