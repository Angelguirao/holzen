/**
 * Edge-side pause helpers.
 *
 * Thin wrappers around the Pause V2 RPCs from Phase B so edge functions
 * (cron + orchestrator) can create instances + log events without
 * reimplementing the fingerprint / counts_for_pause logic.
 *
 * See: `supabase/migrations/20260423201000_pause_rpc_functions.sql`
 *      `docs/systems/pause-system.md`
 */

// Intentionally minimal type surface — edge functions construct their own
// Supabase service-role clients via `_shared/cid-clients.ts`.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

export type PauseState =
  | "active"
  | "engaged"
  | "pending"
  | "completed"
  | "dismissed"
  | "expired";

export type PauseCompanionAction = "open" | "complete";

export interface PauseCreateOrReuseResult {
  instance_id: string | null;
  created: boolean;
  reused_reason: "fingerprint_match" | "recent_dismissal" | null;
  pending_offer?: boolean;
  prior_open_instance_id?: string | null;
}

export interface PauseLogCompanionResult {
  counts_for_pause: boolean;
  non_counting_reason:
    | "no_active_pause"
    | "outside_window"
    | "context_lost"
    | "not_allowed_for_template"
    | "already_counted"
    | null;
  resulting_state: PauseState | null;
}

/**
 * Compute a stable fingerprint for a market-context snapshot.
 *
 * Regime-relevant inputs only — fluctuations within the same regime hash to
 * the same fingerprint so the same cron context doesn't keep creating new
 * pauses. See `docs/systems/pause-system.md` §5 / `PLAN.md` §2.9.
 *
 * Hashing strategy: SHA-256 over a deterministic JSON encoding of the
 * regime keys, hex-encoded. We take the first 32 hex chars (128 bits,
 * plenty for collision resistance in this domain).
 */
export async function computeContextFingerprint(parts: {
  templateSlug: string;
  directionBucket: string;     // 'up' | 'down' | 'flat'
  severityBand: string;         // 'mild' | 'moderate' | 'high'
  dailyBucketPct: number;       // rounded to the nearest whole %
  cumulativeBucketPct: number;  // rounded to the nearest whole %
  /** CoinGecko coin id — keeps fingerprints distinct across assets. */
  trackedAssetId?: string;
  fearGreedBand?: string | null;
  onChainBand?: string | null;
}): Promise<string> {
  const payload = JSON.stringify({
    t: parts.templateSlug,
    d: parts.directionBucket,
    s: parts.severityBand,
    db: parts.dailyBucketPct,
    cb: parts.cumulativeBucketPct,
    a: parts.trackedAssetId ?? "bitcoin",
    fg: parts.fearGreedBand ?? null,
    oc: parts.onChainBand ?? null,
  });
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return encodeHex(new Uint8Array(digest)).slice(0, 32);
}

/**
 * Round a change-percent into a stable bucket so fingerprints are insensitive
 * to minute-to-minute noise. Positive and negative are distinct buckets.
 *   |pct| < 1   -> 0
 *   |pct| < 3   -> 2  (signed: -2 or 2)
 *   |pct| < 5   -> 4
 *   |pct| < 7   -> 6
 *   |pct| < 10  -> 8
 *   |pct| >= 10 -> ceil to nearest 2 (so 10-11.9 -> 10, 12-13.9 -> 12, etc.)
 * Rounds directionally: sign(pct) * bucket.
 */
export function bucketChangePercent(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  const abs = Math.abs(pct);
  const sign = pct < 0 ? -1 : 1;
  let bucket: number;
  if (abs < 1) bucket = 0;
  else if (abs < 3) bucket = 2;
  else if (abs < 5) bucket = 4;
  else if (abs < 7) bucket = 6;
  else if (abs < 10) bucket = 8;
  else bucket = Math.floor(abs / 2) * 2;
  return sign * bucket;
}

/**
 * Create (or reuse) a pause via the Phase B RPC. The caller already holds
 * a service-role supabase client. Pass it `supabase.rpc(...).select()`
 * style. Returns the RPC envelope verbatim.
 */
export async function pauseCreateOrReuse(
  svc: SupabaseClient,
  params: {
    templateSlug: string;
    source: string;
    userId: string; // used to forge a per-request client, see below
    contextSnapshot: Record<string, unknown>;
    contextRuleResult: Record<string, unknown>;
    contextFingerprint: string;
  },
): Promise<PauseCreateOrReuseResult> {
  // The RPC reads auth.uid() for ownership. When called from a service-role
  // client with no Authorization header, auth.uid() is NULL and auth.role()
  // is 'service_role'. In that mode, the RPC rejects (it needs to know the
  // owner). For edge-initiated creates we must go through a per-user
  // forged client; the caller constructs that via `createCidSupabaseClient`
  // or similar. We accept the svc client here to keep types simple; it's
  // the caller's job to ensure auth context matches the intended user.
  const { data, error } = await svc.rpc("pause_create_or_reuse", {
    p_template_slug: params.templateSlug,
    p_source: params.source,
    p_context_snapshot: params.contextSnapshot,
    p_context_rule_result: params.contextRuleResult,
    p_context_fingerprint: params.contextFingerprint,
  });
  if (error) throw error;
  return data as PauseCreateOrReuseResult;
}

/**
 * Insert a pause_ai_artifact for this instance. One row per (instance, kind).
 */
export async function upsertPauseAiArtifact(
  svc: SupabaseClient,
  params: {
    instanceId: string;
    userId: string;
    kind: string;
    content: Record<string, unknown>;
    model?: string | null;
    promptVersion?: string | null;
    cacheEntryId?: string | null;
  },
): Promise<void> {
  const { error } = await svc.from("pause_ai_artifacts").upsert(
    {
      pause_instance_id: params.instanceId,
      user_id: params.userId,
      kind: params.kind,
      content: params.content,
      model: params.model ?? null,
      prompt_version: params.promptVersion ?? null,
      cache_entry_id: params.cacheEntryId ?? null,
    },
    { onConflict: "pause_instance_id,kind" },
  );
  if (error) throw error;
}

/**
 * Append a companion event via the Phase B RPC.
 */
export async function pauseLogCompanion(
  svc: SupabaseClient,
  params: {
    instanceId: string | null;
    companionType: string;
    action: PauseCompanionAction;
    entryPoint: string;
  },
): Promise<PauseLogCompanionResult> {
  const { data, error } = await svc.rpc("pause_log_companion", {
    p_instance_id: params.instanceId,
    p_companion_type: params.companionType,
    p_action: params.action,
    p_entry_point: params.entryPoint,
  });
  if (error) throw error;
  return data as PauseLogCompanionResult;
}

