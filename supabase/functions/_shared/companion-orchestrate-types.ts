import type { CacheServeRelaxation } from "./cache.ts";

/** Where an orchestrate slot result came from. Keep in sync with client `CompanionOrchestrateSlotResult.source`
 *  and with `companion_serves.serve_source` values. `library` = served from `content_library` (curated catalog,
 *  not live AI, not the runtime `companion_cache`). */
export type CompanionResultSource = "live" | "library" | "cache" | "curated" | "empty";

/** Response slot shape for companion-orchestrate JSON (mirrors client `CompanionOrchestrateSlotResult`). */
export interface CompanionResult {
  /** Structured companion JSON — typed as unknown at the wire boundary. */
  data: unknown | null;
  source: CompanionResultSource;
  cacheId: string | null;
  latencyMs: number;
  /** When `serveFromCache` used a relaxed pass (`none` = strict companion_cache hit). */
  cacheRelaxation?: CacheServeRelaxation | null;
  /** Prompt version from the generator — stored as content_fingerprint for regression tracking. */
  promptVersion?: string;
  /** Present when source is `empty` (e.g. DISABLE_COMPANION_FALLBACKS). */
  error?: string;
}

export interface InterventionPayload {
  mode: "insight" | "question";
  primary: { type: string; data: unknown } | null;
  secondary: { type: string; data: unknown } | null;
  question: string | null;
}

export interface OrchestrateResponse {
  signal: CompanionResult | null;
  grounding: CompanionResult | null;
  history: CompanionResult | null;
  zoomOut: CompanionResult | null;
  intervention: InterventionPayload | null;
}

export type OrchestrateSourceInput = {
  name: string;
  type: string;
  url?: string;
};
