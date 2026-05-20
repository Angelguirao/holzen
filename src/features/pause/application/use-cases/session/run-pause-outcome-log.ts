import type { PauseState } from '@/features/pause/domain/pause-state';
import { buildOutcomeLoggedPayload } from '../outcome-log-payload';

export type RunPauseOutcomeLogResult =
  | { status: 'no_instance' }
  | { status: 'completed' }
  | { status: 'not_completed'; outcomeState: PauseState }
  | { status: 'sync_failed' };

type LogOutcomeStepPort = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) => Promise<PauseState | null>;

/** Decide step — `outcome_logged` RPC and completion state gate. */
export async function runPauseOutcomeLog(
  input: { pauseInstanceId: string | null; decision: string },
  ports: { logOutcome: LogOutcomeStepPort },
): Promise<RunPauseOutcomeLogResult> {
  if (!input.pauseInstanceId) {
    return { status: 'no_instance' };
  }

  try {
    const outcomeState = await ports.logOutcome({
      instanceId: input.pauseInstanceId,
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
