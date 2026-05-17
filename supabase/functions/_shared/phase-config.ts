/**
 * Companion generation phase configuration.
 *
 * Shipped order (pause-first strip):
 *   1. Catalog  (companion_catalog — curated essays, papers, events)
 *   2. Cache    (companion_cache — previously generated content)
 *   3. Live     (Perplexity + AI generation)
 *   4. Curated  (static fallback pools — always available as last resort)
 *
 * Toggle via Supabase Edge Function secrets:
 *   COMPANION_PHASE_CATALOG  — default: enabled
 *   COMPANION_PHASE_CACHE    — default: enabled
 *   COMPANION_PHASE_LIVE     — default: enabled
 *
 * Set to "0", "false", or "no" to disable a phase.
 *
 * When DISABLE_COMPANION_FALLBACKS is set, only the live phase runs
 * (existing behaviour for testing live paths without masking failures).
 */

export type CompanionPhase = "catalog" | "cache" | "live";

export interface PhaseConfig {
  catalog: boolean;
  cache: boolean;
  live: boolean;
}

function readBoolEnv(key: string, defaultValue: boolean): boolean {
  const v = typeof Deno !== "undefined" ? Deno.env.get(key) : undefined;
  if (v === undefined || v === null || v === "") return defaultValue;
  return !(v === "0" || v === "false" || v === "no");
}

/** Read the phase config from env vars. Catalog, cache, and live enabled by default. */
export function getPhaseConfig(): PhaseConfig {
  return {
    catalog: readBoolEnv("COMPANION_PHASE_CATALOG", true),
    cache: readBoolEnv("COMPANION_PHASE_CACHE", true),
    live: readBoolEnv("COMPANION_PHASE_LIVE", true),
  };
}

/** Returns the ordered list of active phases. */
export function getActivePhases(): CompanionPhase[] {
  const config = getPhaseConfig();
  const phases: CompanionPhase[] = [];
  if (config.catalog) phases.push("catalog");
  if (config.cache) phases.push("cache");
  if (config.live) phases.push("live");
  return phases;
}
