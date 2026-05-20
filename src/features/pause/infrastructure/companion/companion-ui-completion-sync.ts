import { supabase } from '@/integrations/supabase/client';
import { deriveBreathingUiCompleteFromPayloads } from '@/features/pause/application/use-cases/ritual/frame/breathing-ui-complete';
import {
  type CompanionUiCompletionStep,
  type CompanionUiCompletionState,
} from '@/features/pause/application/use-cases/ritual/frame/companion-ui-completion-types';
import { persistCompanionUiStepCompletion as persistCompanionUiStepCompletionUseCase } from '@/features/pause/application/use-cases/companion/persist-ui-step-completion';
import { invalidateCompanionUiCompletionQuery } from '@/features/pause/application/queries/companion-ui-completion-query-key';
import { supabasePauseRepository } from '@/features/pause/infrastructure/supabase-pause-repository';

export type { CompanionUiCompletionStep, CompanionUiCompletionState };
export { EMPTY_COMPANION_UI_COMPLETION } from '@/features/pause/application/use-cases/ritual/frame/companion-ui-completion-types';

export {
  companionUiCompletionQueryKey,
  invalidateCompanionUiCompletionQuery,
} from '@/features/pause/application/queries/companion-ui-completion-query-key';

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
  await persistCompanionUiStepCompletionUseCase(
    supabasePauseRepository,
    pauseInstanceId,
    step,
    options,
  );
  invalidateCompanionUiCompletionQuery(pauseInstanceId);
}
