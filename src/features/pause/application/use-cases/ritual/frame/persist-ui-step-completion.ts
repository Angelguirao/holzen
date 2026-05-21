import { logPauseCompanion } from '@/features/pause/application/use-cases/ritual/frame/log-pause-companion';
import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { PauseStepType } from '@/features/pause/domain/pause-state';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { CompanionUiCompletionStep } from '@/features/pause/application/use-cases/ritual/frame/companion-ui-completion-types';

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

/** Persist reflect-strip chip completion (breath step or counted companion). */
export async function persistCompanionUiStepCompletion(
  repository: PauseRepository,
  pauseInstanceId: string,
  step: CompanionUiCompletionStep,
  options?: { entryPoint?: string },
): Promise<void> {
  const stepType = STEP_TO_STEP_TYPE[step];
  if (stepType) {
    await logPauseStep(repository, {
      instanceId: pauseInstanceId,
      stepType,
    }).catch(() => undefined);
    return;
  }

  const companionType = STEP_TO_COMPANION_TYPE[step];
  if (!companionType) return;

  await logPauseCompanion(repository, {
    instanceId: pauseInstanceId,
    companionType,
    action: 'complete',
    entryPoint: options?.entryPoint ?? 'pause_flow',
  }).catch(() => undefined);
}
