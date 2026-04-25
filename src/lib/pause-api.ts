/**
 * Typed client wrappers around the Pause V2 RPCs.
 *
 * Every authenticated pause mutation in V2 goes through one of these four
 * functions. Direct inserts into `pause_instances` / `pause_step_events` /
 * `pause_companion_events` are rejected by RLS — the RPCs are the only
 * front door.
 *
 * Note on typing: the generated `types.ts` may not list these RPCs until
 * `npm run gen:types` is re-run. Until then we cast the function name with
 * `as never` (same pattern as admin-only RPCs). Arguments and return values
 * stay typed at this module boundary.
 *
 * See: `supabase/migrations/20260423201000_pause_rpc_functions.sql`,
 *      `docs/systems/pause-system.md`.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  PauseState,
  PauseStepType,
  PauseCompanionAction,
  PauseCompanionNonCountingReason,
} from '@/lib/pause-state';

/** Shape of the JSONB envelope returned by `pause_create_or_reuse`. */
export interface PauseCreateOrReuseResult {
  instance_id: string | null;
  created: boolean;
  reused_reason: 'fingerprint_match' | 'recent_dismissal' | null;
}

export async function pauseCreateOrReuse(params: {
  templateSlug: string;
  source: string;
  contextSnapshot: Record<string, unknown>;
  contextRuleResult: Record<string, unknown>;
  contextFingerprint: string;
}): Promise<PauseCreateOrReuseResult> {
  const { data, error } = await supabase.rpc('pause_create_or_reuse' as never, {
    p_template_slug: params.templateSlug,
    p_source: params.source,
    p_context_snapshot: params.contextSnapshot,
    p_context_rule_result: params.contextRuleResult,
    p_context_fingerprint: params.contextFingerprint,
  } as never);
  if (error) throw error;
  return (data ?? { instance_id: null, created: false, reused_reason: null }) as PauseCreateOrReuseResult;
}

export async function pauseLogStep(params: {
  instanceId: string;
  stepType: PauseStepType;
  payload?: Record<string, unknown>;
}): Promise<PauseState | null> {
  const { data, error } = await supabase.rpc('pause_log_step' as never, {
    p_instance_id: params.instanceId,
    p_step_type: params.stepType,
    p_payload: params.payload ?? {},
  } as never);
  if (error) throw error;
  return (data as PauseState | null) ?? null;
}

export interface PauseLogCompanionResult {
  counts_for_pause: boolean;
  non_counting_reason: PauseCompanionNonCountingReason | null;
  resulting_state: PauseState | null;
}

export async function pauseLogCompanion(params: {
  instanceId: string | null;
  companionType: string;
  action: PauseCompanionAction;
  entryPoint: string;
}): Promise<PauseLogCompanionResult> {
  const { data, error } = await supabase.rpc('pause_log_companion' as never, {
    p_instance_id: params.instanceId,
    p_companion_type: params.companionType,
    p_action: params.action,
    p_entry_point: params.entryPoint,
  } as never);
  if (error) throw error;
  return (data ?? {
    counts_for_pause: false,
    non_counting_reason: null,
    resulting_state: null,
  }) as PauseLogCompanionResult;
}

export async function pauseDismissCurrent(): Promise<PauseState | null> {
  const { data, error } = await supabase.rpc('pause_dismiss_current' as never);
  if (error) throw error;
  return (data as PauseState | null) ?? null;
}
