import { buildManualPauseCreateOrReuseParams } from '@/features/pause/application/use-cases/ritual/reflect/generation/build-manual-pause-create-or-reuse-params';
import { pauseCreateSkippedUserMessage } from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-create-skipped-user-message';
import { runPauseCreateOrReuse } from '@/features/pause/application/use-cases/session/run-pause-create-or-reuse';
import { runOpenManualPauseSilentModeAfterCreate } from '@/features/pause/application/use-cases/ritual/reflect/generation/run-open-manual-pause-silent-mode-after-create';
import type {
  OpenManualPauseFromHomeError,
  OpenManualPauseFromHomeParams,
  OpenManualPauseFromHomePorts,
  OpenManualPauseFromHomeResult,
} from './open-manual-pause-from-home-types';

export type {
  OpenManualPauseFromHomeError,
  OpenManualPauseFromHomeIdle,
  OpenManualPauseFromHomeParams,
  OpenManualPauseFromHomePorts,
  OpenManualPauseFromHomeResult,
  OpenManualPauseFromHomeSuccess,
} from './open-manual-pause-from-home-types';

function mapCreateOrReuseError(e: unknown): OpenManualPauseFromHomeError {
  const raw = e instanceof Error ? e.message : String(e);
  if (raw.includes('fetch') || raw.includes('network') || raw.includes('Failed to fetch')) {
    return {
      outcome: 'error',
      userMessage: 'Could not reach Holzen. Check your connection.',
      isNetwork: true,
    };
  }
  return {
    outcome: 'error',
    userMessage: 'Could not open a pause right now. Try again shortly.',
    isNetwork: false,
  };
}

/** Home "Need a moment": `pause_create_or_reuse` (+ silent reflection stub when enabled). */
export async function openManualPauseFromHome(
  ports: OpenManualPauseFromHomePorts,
  params: OpenManualPauseFromHomeParams,
): Promise<OpenManualPauseFromHomeResult> {
  try {
    const createParams = await buildManualPauseCreateOrReuseParams(params);
    const res = await runPauseCreateOrReuse(ports.repository, createParams);
    if (!res.instance_id) {
      return { outcome: 'idle', userMessage: pauseCreateSkippedUserMessage(res.reused_reason) };
    }

    const pendingOffer = res.pending_offer === true;

    if (params.silentMode) {
      return runOpenManualPauseSilentModeAfterCreate(ports.reflect, {
        pauseInstanceId: res.instance_id,
        userId: params.userId,
        contextText: params.contextText,
        silentMessage: params.silentMessage,
        pendingOffer,
        created: res.created,
      });
    }

    return {
      outcome: 'opened',
      instanceId: res.instance_id,
      context: params.contextText,
      pendingOffer,
      created: res.created,
      silentStubPersisted: false,
    };
  } catch (e: unknown) {
    return mapCreateOrReuseError(e);
  }
}
