import type { PauseState } from '@/features/pause/domain/pause-state';
import { logPauseStep } from '@/features/pause/application/use-cases/ritual/log/log-pause-step';
import type { RunPauseOutcomeLogResult } from '@/features/pause/domain/decide/pause-outcome-log-result';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { buildOutcomeLoggedPayload } from './outcome-log-payload';

export type { RunPauseOutcomeLogResult } from '@/features/pause/domain/decide/pause-outcome-log-result';

/**
 * Decide step — `outcome_logged` RPC and completion state gate.
 * Reflect+decide presentation: `pause-reflect-flows-io.ts` imports this leaf directly
 * (not `pause-reflect-flows-flow`). Parity pins: `pause-reflect-flows-io-parity.test.ts`.
 */
export async function runPauseOutcomeLog(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; decision: string },
): Promise<RunPauseOutcomeLogResult> {
  if (!input.pauseInstanceId) {
    return { status: 'no_instance' };
  }

  try {
    const outcomeState = await logPauseStep(repository, {
      instanceId: input.pauseInstanceId,
      stepType: 'outcome_logged',
      payload: buildOutcomeLoggedPayload(input.decision),
    });
    if (outcomeState !== 'completed') {
      return { status: 'not_completed', outcomeState: outcomeState ?? 'pending' };
    }
    return { status: 'completed' };
  } catch {
    return { status: 'sync_failed' };
  }
}
