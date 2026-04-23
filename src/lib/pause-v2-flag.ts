/**
 * Read the pause_v2_enabled feature flag from Supabase `app_config`.
 *
 * Cached in-module for one minute so every hook doesn't round-trip on every
 * mount. Defensive: any error path resolves to `false` so the legacy path
 * stays live on transient DB issues.
 *
 * The flag is intentionally read from the shared `app_config.feature_flags`
 * jsonb (same one edge functions use) rather than being hard-coded in env
 * — so flipping it at Phase J is a single SQL write, not a frontend redeploy.
 */

import { supabase } from '@/integrations/supabase/client';

const CACHE_TTL_MS = 60_000;
let cached: { value: boolean; loadedAt: number } | null = null;

/**
 * Returns the current value of pause_v2_enabled, cached for 1 minute.
 * Never throws; on error returns the last known value, or false.
 */
export async function isPauseV2Enabled(): Promise<boolean> {
  const now = Date.now();
  if (cached && now - cached.loadedAt < CACHE_TTL_MS) return cached.value;
  try {
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: { value: unknown } | null }>;
          };
        };
      };
    })
      .from('app_config')
      .select('value')
      .eq('key', 'feature_flags')
      .maybeSingle();
    const flags = (data?.value ?? {}) as Record<string, unknown>;
    const value = flags?.pause_v2_enabled === true;
    cached = { value, loadedAt: now };
    return value;
  } catch {
    return cached?.value ?? false;
  }
}

/** Forget the cached value; next read fetches fresh. Useful for tests. */
export function resetPauseV2FlagCache(): void {
  cached = null;
}
