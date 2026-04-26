// Structural type to avoid pulling in @supabase/supabase-js (which has divergent
// resolution paths in Vite/tsc vs Deno). Both real clients satisfy this shape.
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

/**
 * Last-resort fallback pools when live generation and cache miss.
 * Canonical seed: ./fallback-seed.json (also seeded into companion_fallbacks).
 * Runtime prefers DB rows (admin-editable); falls back to file seed if empty/error.
 */

import seed from "./fallback-seed.json" with { type: "json" };

export type FallbackPoolType =
  | "signal"
  | "grounding"
  | "history"
  | "zoom_out"
  | "reflection";

type SeedShape = {
  signal: Array<{ title: string; body: string; source: string; url: string }>;
  grounding: Array<{ title: string; body: string; citation: string; url: string }>;
  history: Array<Record<string, unknown>>;
  zoom_out: Array<{ title: string; body: string }>;
  reflection: Array<{ message: string; haiku: string }>;
};

const S = seed as SeedShape;

/** @deprecated Prefer loadFallbackPool — kept for tests and emergency sync */
export const SIGNAL_FALLBACKS = S.signal;
export const GROUNDING_FALLBACKS = S.grounding;
export const HISTORY_FALLBACKS = S.history;
export const ZOOM_OUT_FALLBACKS = S.zoom_out;
export const REFLECTION_FALLBACKS = S.reflection;

const SEED_BY_POOL: Record<FallbackPoolType, unknown[]> = {
  signal: S.signal,
  grounding: S.grounding,
  history: S.history,
  zoom_out: S.zoom_out,
  reflection: S.reflection,
};

/**
 * Active pool for generation: DB rows when present, else bundled seed JSON.
 */
export async function loadFallbackPool<T>(
  svcClient: SupabaseClient,
  poolType: FallbackPoolType,
): Promise<T[]> {
  try {
    const { data, error } = await svcClient
      .from("companion_fallbacks")
      .select("payload")
      .eq("pool_type", poolType)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((r: { payload: unknown }) => r.payload as T);
    }
  } catch (e) {
    console.error("[fallbacks] loadFallbackPool", poolType, e);
  }
  return SEED_BY_POOL[poolType] as T[];
}

/** Pick a random item from a fallback pool */
export function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Edge Function secret: when `1` / `true` / `yes`, generators skip library → cache → curated
 * after live generation fails (and holzen-reflect returns errors instead of curated pools).
 * Use to verify live paths without masking failures.
 */
export const ENV_DISABLE_COMPANION_FALLBACKS = "DISABLE_COMPANION_FALLBACKS";

export function companionFallbacksDisabled(): boolean {
  // Use globalThis to keep Vite/tsc happy (no Deno global in browser typecheck).
  // deno-lint-ignore no-explicit-any
  const denoGlobal = (globalThis as any).Deno;
  const v = denoGlobal?.env?.get?.(ENV_DISABLE_COMPANION_FALLBACKS);
  return v === "1" || v === "true" || v === "yes";
}

export const COMPANION_FALLBACKS_DISABLED_MESSAGE =
  "Companion fallbacks disabled (DISABLE_COMPANION_FALLBACKS). Live generation failed or API keys missing.";
