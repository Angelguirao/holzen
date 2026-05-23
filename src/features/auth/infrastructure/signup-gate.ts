/**
 * Signup gate — now DB-backed.
 *
 * Reads `get_signup_gate()` RPC (security definer) which consults the
 * `app_config` table for `signups_enabled` + `signups_max_per_day` and
 * compares today's UTC signup count to the cap.
 *
 * Admin UI lives in `/admin` → Tools tab. Flipping the DB row propagates
 * within seconds — no redeploy required.
 *
 * The legacy `SIGNUPS_ENABLED` constant is preserved as an **emergency**
 * failsafe: if the RPC is unreachable or errors, we fall back to this flag.
 * Flip it to `false` and redeploy only if the DB itself is compromised.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** Emergency failsafe used only when the RPC fails. */
export const SIGNUPS_ENABLED = true;

export interface SignupGateStatus {
  allow: boolean;
  enabled: boolean;
  maxPerDay: number | null;
  todayCount: number;
  /** Populated when `allow` is false, for UI copy. */
  reason?: 'disabled' | 'daily_cap';
}

const CACHE_TTL_MS = 30_000;
let cache: { at: number; status: SignupGateStatus } | null = null;

export async function checkSignupGate(client: SupabaseClient): Promise<SignupGateStatus> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.status;

  try {
    const { data, error } = await client.rpc('get_signup_gate');
    if (error || !data) throw error ?? new Error('empty response');

    const raw = data as {
      allow?: boolean;
      enabled?: boolean;
      max_per_day?: number | null;
      today_count?: number;
    };

    const enabled = raw.enabled !== false;
    const maxPerDay = typeof raw.max_per_day === 'number' ? raw.max_per_day : null;
    const todayCount = typeof raw.today_count === 'number' ? raw.today_count : 0;
    const allow = raw.allow !== false;

    let reason: SignupGateStatus['reason'];
    if (!allow) {
      reason = !enabled ? 'disabled' : 'daily_cap';
    }

    const status: SignupGateStatus = { allow, enabled, maxPerDay, todayCount, reason };
    cache = { at: now, status };
    return status;
  } catch {
    const status: SignupGateStatus = {
      allow: SIGNUPS_ENABLED,
      enabled: SIGNUPS_ENABLED,
      maxPerDay: null,
      todayCount: 0,
      reason: SIGNUPS_ENABLED ? undefined : 'disabled',
    };
    return status;
  }
}

/** For tests only. */
export function _resetSignupGateCache() {
  cache = null;
}
