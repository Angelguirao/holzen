/** Response slot shape for companion-orchestrate JSON (mirrors client `CompanionOrchestrateSlotResult`). */
export interface CompanionResult {
  data: any | null;
  source: "live" | "cache" | "curated" | "empty";
  cacheId: string | null;
  latencyMs: number;
  /** Prompt version from the generator — stored as content_fingerprint for regression tracking. */
  promptVersion?: string;
  /** Present when source is `empty` (e.g. DISABLE_COMPANION_FALLBACKS). */
  error?: string;
}

export interface InterventionPayload {
  mode: "insight" | "question";
  primary: { type: string; data: any } | null;
  secondary: { type: string; data: any } | null;
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
