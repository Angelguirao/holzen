import { supabase } from '@/integrations/supabase/client';
import { deriveBreathingUiCompleteFromPayloads } from '@/features/pause/application/companion/breathing-ui-complete';
import {
  type CompanionUiCompletionStep,
  type CompanionUiCompletionState,
} from '@/features/pause/application/companion/companion-ui-completion-types';
import { invalidateCompanionUiCompletionQuery } from '@/features/pause/application/queries/companion-ui-completion-query-key';
import { pauseLogCompanion, pauseLogStep } from '@/features/pause/public-rpc';
import type { PauseStepType } from '@/features/pause/domain/pause-state';

export type { CompanionUiCompletionStep, CompanionUiCompletionState };
export { EMPTY_COMPANION_UI_COMPLETION } from '@/features/pause/application/companion/companion-ui-completion-types';

export {
  companionUiCompletionQueryKey,
  invalidateCompanionUiCompletionQuery,
} from '@/features/pause/application/queries/companion-ui-completion-query-key';

const STEP_TO_COMPANION_TYPE: Record<CompanionUiCompletionStep, string | null> = {
  breathing: null,
  haiku: 'haiku',
  grounding: 'ground_nudge',
  signal: 'signal',
  zoomOut: 'zoom_out',
  history: 'historical_insight',
};

const STEP_TO_STEP_TYPE: Record<CompanionUiCompletionStep, PauseStepType | null> = {
  breathing: 'breath_completed',
  haiku: null,
  grounding: null,
  signal: null,
  zoomOut: null,
  history: null,
};

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
  for (const c of (companionRows ?? []) as Array<{
    companion_type: string;
    counts_for_pause: boolean;
  }>) {
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
    invalidateCompanionUiCompletionQuery(pauseInstanceId);
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
  invalidateCompanionUiCompletionQuery(pauseInstanceId);
}
