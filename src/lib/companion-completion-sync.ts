import { supabase } from '@/integrations/supabase/client';
import { deriveBreathingUiCompleteFromPayloads } from '@/lib/companion-breath-completion-detect';
import { pauseLogStep, pauseLogCompanion } from '@/lib/pause-api';
import type { PauseStepType } from '@/lib/pause-state';

export type CompanionUiCompletionStep =
  | 'breathing'
  | 'haiku'
  | 'grounding'
  | 'signal'
  | 'zoomOut'
  | 'history';

export interface CompanionUiCompletionState {
  breathing: boolean;
  haiku: boolean;
  grounding: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}

/** Default / placeholder before the first `loadCompanionUiCompletionState` result. */
export const EMPTY_COMPANION_UI_COMPLETION: CompanionUiCompletionState = {
  breathing: false,
  haiku: false,
  grounding: false,
  signal: false,
  zoomOut: false,
  history: false,
};

export function companionUiCompletionQueryKey(pauseInstanceId: string) {
  return ['pause', 'companion-ui-completion', pauseInstanceId] as const;
}

/** Map a UI step key to the V2 companion_type persisted on pause_companion_events. */
const STEP_TO_COMPANION_TYPE: Record<CompanionUiCompletionStep, string | null> = {
  breathing: null, // breath is a step event, not a companion
  haiku: 'haiku',
  grounding: 'ground_nudge',
  signal: 'signal',
  zoomOut: 'zoom_out',
  history: 'historical_insight',
};

/** UI-step tag used in the set returned by collectStepTypes. */
const STEP_TO_STEP_TYPE: Record<CompanionUiCompletionStep, PauseStepType | null> = {
  breathing: 'breath_completed',
  haiku: null,
  grounding: null,
  signal: null,
  zoomOut: null,
  history: null,
};

/**
 * Hydrate "completed / read" UI state for one pause from the V2 tables.
 * Breathing reads `pause_step_events` (`breath_completed`); dual-segment pauses need
 * both `breath_segment` 1 and 2 in payloads (see `deriveBreathingUiCompleteFromPayloads`).
 * Every companion reads `pause_companion_events` with `counts_for_pause=true`.
 */
export async function loadCompanionUiCompletionState(
  pauseInstanceId: string,
): Promise<CompanionUiCompletionState> {
  const [{ data: breathRows }, { data: companionRows }] = await Promise.all([
    supabase
      .from('pause_step_events' as never)
      .select('payload')
      .eq('pause_instance_id', pauseInstanceId)
      .eq('step_type', 'breath_completed'),
    supabase
      .from('pause_companion_events' as never)
      .select('companion_type, counts_for_pause')
      .eq('pause_instance_id', pauseInstanceId)
      .eq('action', 'complete'),
  ]);

  const breathing = deriveBreathingUiCompleteFromPayloads(
    (breathRows ?? []) as Array<{ payload?: unknown }>,
  );

  const companionCompleted = new Set<string>();
  for (const c of ((companionRows ?? []) as Array<{
    companion_type: string;
    counts_for_pause: boolean;
  }>)) {
    companionCompleted.add(c.companion_type);
  }

  return {
    breathing,
    haiku: companionCompleted.has('haiku'),
    grounding: companionCompleted.has('ground_nudge'),
    signal: companionCompleted.has('signal'),
    zoomOut:
      companionCompleted.has('zoom_out') || companionCompleted.has('zoom_out_deep_time'),
    history: companionCompleted.has('historical_insight'),
  };
}

/**
 * Persist "completed" for one pause step via the Phase B RPCs.
 * - breathing  -> pause_log_step(breath_completed, {})
 * - companions -> pause_log_companion(complete, entry_point='pause_flow')
 *
 * The RPC decides counts_for_pause server-side based on template +
 * window + existing events. Callers don't pass that flag.
 */
export async function persistCompanionUiStepCompletion(
  pauseInstanceId: string,
  step: CompanionUiCompletionStep,
  options?: { entryPoint?: string },
): Promise<void> {
  const stepType = STEP_TO_STEP_TYPE[step];
  if (stepType) {
    await pauseLogStep({
      instanceId: pauseInstanceId,
      stepType,
    }).catch(() => undefined);
    return;
  }

  const companionType = STEP_TO_COMPANION_TYPE[step];
  if (!companionType) return;

  await pauseLogCompanion({
    instanceId: pauseInstanceId,
    companionType,
    action: 'complete',
    entryPoint: options?.entryPoint ?? 'pause_flow',
  }).catch(() => undefined);
}
