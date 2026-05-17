/**
 * Companion generation phase configuration.
 *
 * Controls the order in which companions are resolved:
 *   1. Library  (deprecated — content_library dropped; off by default)
 *   2. Cache    (companion_cache — previously generated content)
 *   3. Live     (Perplexity + AI generation)
 *   4. Curated  (static fallback pools — always available as last resort)
 *
 * Each phase can be toggled via Supabase Edge Function secrets:
 *   COMPANION_PHASE_LIBRARY  — default: enabled
 *   COMPANION_PHASE_CACHE    — default: enabled
 *   COMPANION_PHASE_LIVE     — default: enabled
 *
 * Set to "0", "false", or "no" to disable a phase.
 *
 * When DISABLE_COMPANION_FALLBACKS is set, only the live phase runs
 * (existing behaviour for testing live paths without masking failures).
 */

export type CompanionPhase = "library" | "cache" | "live";

export interface PhaseConfig {
  library: boolean;
  cache: boolean;
  live: boolean;
}

function readBoolEnv(key: string, defaultValue: boolean): boolean {
  const v = typeof Deno !== "undefined" ? Deno.env.get(key) : undefined;
  if (v === undefined || v === null || v === "") return defaultValue;
  return !(v === "0" || v === "false" || v === "no");
}

/** Read the phase config from env vars. All phases enabled by default. */
export function getPhaseConfig(): PhaseConfig {
  return {
    library: readBoolEnv("COMPANION_PHASE_LIBRARY", false),
    cache: readBoolEnv("COMPANION_PHASE_CACHE", true),
    live: readBoolEnv("COMPANION_PHASE_LIVE", true),
  };
}

/** Returns the ordered list of active phases. */
export function getActivePhases(): CompanionPhase[] {
  const config = getPhaseConfig();
  const phases: CompanionPhase[] = [];
  if (config.library) phases.push("library");
  if (config.cache) phases.push("cache");
  if (config.live) phases.push("live");
  return phases;
}
