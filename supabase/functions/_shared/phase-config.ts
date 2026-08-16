/**
 * Companion generation phase configuration.
 *
 * Shipped order:
 *   1. Catalog  (companion_catalog)
 *   2. Corpus   (holzen_chunks hybrid retrieve)
 *   3. Cache    (companion_cache)
 *   4. Live     (Perplexity + AI generation)
 *   5. Curated  (static fallback pools)
 *
 * Toggle via Edge secrets:
 *   COMPANION_PHASE_CATALOG  — default: enabled
 *   COMPANION_PHASE_CORPUS   — default: enabled
 *   COMPANION_PHASE_CACHE    — default: enabled
 *   COMPANION_PHASE_LIVE     — default: enabled
 *
 * Set to "0", "false", or "no" to disable a phase.
 */

export type CompanionPhase = "catalog" | "corpus" | "cache" | "live";

export interface PhaseConfig {
  catalog: boolean;
  corpus: boolean;
  cache: boolean;
  live: boolean;
}

function readBoolEnv(key: string, defaultValue: boolean): boolean {
  const v = typeof Deno !== "undefined" ? Deno.env.get(key) : undefined;
  if (v === undefined || v === null || v === "") return defaultValue;
  return !(v === "0" || v === "false" || v === "no");
}

export function getPhaseConfig(): PhaseConfig {
  return {
    catalog: readBoolEnv("COMPANION_PHASE_CATALOG", true),
    corpus: readBoolEnv("COMPANION_PHASE_CORPUS", true),
    cache: readBoolEnv("COMPANION_PHASE_CACHE", true),
    live: readBoolEnv("COMPANION_PHASE_LIVE", true),
  };
}

export function getActivePhases(): CompanionPhase[] {
  const config = getPhaseConfig();
  const phases: CompanionPhase[] = [];
  if (config.catalog) phases.push("catalog");
  if (config.corpus) phases.push("corpus");
  if (config.cache) phases.push("cache");
  if (config.live) phases.push("live");
  return phases;
}
