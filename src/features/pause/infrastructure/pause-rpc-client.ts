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
 *      `docs/systems/pause-system.md` (section 4 — RPCs and transitions; section 7 — client ritual).
 */

import { supabase } from '@/integrations/supabase/client';
import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';
import { invalidatePauseStatsDataForUser } from '@/lib/pause-stats-invalidate';
import { pauseSessionFetchedInstanceQueryKey } from '@/lib/pause-session-fetched-instance-query';
import { pauseInstanceQueryPrefix } from '@/lib/pause-instance-query-prefix';
import { pauseTerminalEntryStateQueryKey } from '@/lib/pause-terminal-entry-state-query';
import { pauseSessionCompanionSnapshotQueryKey } from '@/lib/pause-page-loader';
import { invalidateCompanionUiCompletionQuery } from '@/features/pause/application/queries/companion-ui-completion-query-key';
import { trackEvent } from '@/lib/posthog';
import type {
  PauseAdoptPendingResult,
  PauseCreateOrReuseResult,
  PauseLogCompanionResult,
} from '@/features/pause/domain/rpc-types';
import type {
  PauseState,
  PauseStepType,
  PauseCompanionAction,
} from '@/features/pause/domain/pause-state';

export type {
  PauseAdoptPendingResult,
  PauseCreateOrReuseResult,
  PauseLogCompanionResult,
} from '@/features/pause/domain/rpc-types';

/** Dedupe PostHog pause lifecycle events (RPC can return the same state repeatedly). */
const phPauseEngagedSent = new Set<string>();
const phPauseCompletedSent = new Set<string>();

function scheduleInvalidatePauseStatsOnCompleted(pauseInstanceId: string) {
  void supabase.auth.getUser().then(({ data: { user } }) => {
    invalidatePauseStatsDataForUser(user?.id);
    invalidateCompanionUiCompletionQuery(pauseInstanceId);
    const qc = getHolzenQueryClient();
    if (qc) {
      void qc.invalidateQueries({ queryKey: pauseSessionCompanionSnapshotQueryKey(pauseInstanceId) });
      void qc.invalidateQueries({ queryKey: pauseSessionFetchedInstanceQueryKey(pauseInstanceId) });
      void qc.invalidateQueries({ queryKey: pauseInstanceQueryPrefix(pauseInstanceId) });
      void qc.invalidateQueries({ queryKey: pauseTerminalEntryStateQueryKey(pauseInstanceId) });
    }
  });
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
  return (data ?? {
    instance_id: null,
    created: false,
    reused_reason: null,
    pending_offer: false,
    prior_open_instance_id: null,
  }) as PauseCreateOrReuseResult;
}

export async function pauseAdoptPendingOffer(): Promise<PauseAdoptPendingResult> {
  const { data, error } = await supabase.rpc('pause_adopt_pending_offer' as never);
  if (error) throw error;
  return (data ?? { ok: false }) as PauseAdoptPendingResult;
}

export async function pauseDeclinePendingOffer(): Promise<{ ok: boolean; cleared: number }> {
  const { data, error } = await supabase.rpc('pause_decline_pending_offer' as never);
  if (error) throw error;
  return (data ?? { ok: false, cleared: 0 }) as { ok: boolean; cleared: number };
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
  const state = (data as PauseState | null) ?? null;
  if (params.stepType === 'post_pause_emotion_logged') {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      invalidatePauseStatsDataForUser(user?.id);
    });
  }
  if (state === 'engaged' && !phPauseEngagedSent.has(params.instanceId)) {
    phPauseEngagedSent.add(params.instanceId);
    try {
      trackEvent('pause_engaged', { pause_instance_id: params.instanceId });
    } catch {
      /* no-op */
    }
  }
  if (state === 'completed' && !phPauseCompletedSent.has(params.instanceId)) {
    phPauseCompletedSent.add(params.instanceId);
    try {
      trackEvent('pause_completed', { pause_instance_id: params.instanceId });
    } catch {
      /* no-op */
    }
    scheduleInvalidatePauseStatsOnCompleted(params.instanceId);
  }
  return state;
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
  const result = (data ?? {
    counts_for_pause: false,
    non_counting_reason: null,
    resulting_state: null,
  }) as PauseLogCompanionResult;

  if (params.action === 'complete') {
    try {
      if (params.instanceId) {
        if (result.counts_for_pause) {
          trackEvent('pause_companion_counted', {
            pause_instance_id: params.instanceId,
            companion_type: params.companionType,
            entry_point: params.entryPoint,
          });
        } else {
          trackEvent('pause_companion_not_counted', {
            pause_instance_id: params.instanceId,
            companion_type: params.companionType,
            reason: result.non_counting_reason ?? 'no_active_pause',
            entry_point: params.entryPoint,
          });
        }
      } else {
        trackEvent('pause_companion_not_counted', {
          companion_type: params.companionType,
          reason: result.non_counting_reason ?? 'no_active_pause',
          entry_point: params.entryPoint,
        });
      }
    } catch {
      /* no-op */
    }
  }

  // Completion can be reached by the *last* counted companion (template requires ≥1) after all
  // step events — that transition is visible only on `pause_log_companion`’s `resulting_state`.
  if (
    params.instanceId &&
    result.resulting_state === 'completed' &&
    !phPauseCompletedSent.has(params.instanceId)
  ) {
    phPauseCompletedSent.add(params.instanceId);
    try {
      trackEvent('pause_completed', { pause_instance_id: params.instanceId });
    } catch {
      /* no-op */
    }
    scheduleInvalidatePauseStatsOnCompleted(params.instanceId);
  }

  return result;
}

export async function pauseDismissCurrent(): Promise<PauseState | null> {
  const { data, error } = await supabase.rpc('pause_dismiss_current' as never);
  if (error) throw error;
  return (data as PauseState | null) ?? null;
}
