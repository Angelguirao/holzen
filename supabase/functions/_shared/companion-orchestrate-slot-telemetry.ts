/**
 * One structured line per companion slot when `companion-orchestrate` finishes a generator.
 * Grep: `companion_slot_resolved` or `"holzen_event":"companion_slot_resolved"`.
 */

export function logCompanionSlotResolved(params: {
  companion_type: string;
  orchestrator_slot: string;
  pause_prefix: string | null;
  source: string;
  cache_relaxation?: string | null;
  latency_ms: number;
  filled: boolean;
  error?: string | null;
}): void {
  try {
    console.log(
      JSON.stringify({
        holzen_event: "companion_slot_resolved",
        companion_type: params.companion_type,
        orchestrator_slot: params.orchestrator_slot,
        pause_prefix: params.pause_prefix,
        source: params.source,
        cache_relaxation: params.cache_relaxation ?? null,
        latency_ms: params.latency_ms,
        filled: params.filled,
        error: params.error ?? null,
        ts: new Date().toISOString(),
      }),
    );
  } catch {
    /* ignore */
  }
}
