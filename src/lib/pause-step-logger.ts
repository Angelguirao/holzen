/**
 * PauseSession step / companion event logger (Phase E).
 *
 * Thin wrapper around the Phase B RPCs (`pause_log_step`,
 * `pause_log_companion`) that the pause UI calls after each user action.
 * Every call is gated on the `pause_v2_enabled` feature flag and guarded
 * against a null `pauseInstanceId` (for example when the user is
 * continuing a legacy reflection that predated V2) — both conditions
 * result in a silent no-op so the UI behaves identically whether or not
 * V2 is live.
 *
 * Failures never throw; they're logged via holzenLog.pause so Sentry /
 * BetterStack catch them, but the pause flow keeps going.
 */

import { isPauseV2Enabled } from '@/lib/pause-v2-flag';
import { pauseLogStep, pauseLogCompanion } from '@/lib/pause-api';
import type {
  PauseStepType,
  PauseCompanionAction,
} from '@/lib/pause-state';
import { holzenLog } from '@/lib/holzen-console';

export async function logPauseStepIfV2(params: {
  pauseInstanceId: string | null | undefined;
  stepType: PauseStepType;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (!params.pauseInstanceId) return;
  try {
    if (!(await isPauseV2Enabled())) return;
    await pauseLogStep({
      instanceId: params.pauseInstanceId,
      stepType: params.stepType,
      payload: params.payload ?? {},
    });
  } catch (e) {
    holzenLog.pause('pause_v2 log_step failed', {
      stepType: params.stepType,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function logPauseCompanionIfV2(params: {
  pauseInstanceId: string | null | undefined;
  companionType: string;
  action: PauseCompanionAction;
  entryPoint: string;
}): Promise<{ counted: boolean; reason: string | null } | null> {
  if (!params.pauseInstanceId && params.action === 'open') {
    // Opens outside an active pause are still useful analytics; fall through
    // — the RPC accepts a null instance id.
  } else if (!params.pauseInstanceId) {
    return null;
  }
  try {
    if (!(await isPauseV2Enabled())) return null;
    const res = await pauseLogCompanion({
      instanceId: params.pauseInstanceId ?? null,
      companionType: params.companionType,
      action: params.action,
      entryPoint: params.entryPoint,
    });
    return {
      counted: res.counts_for_pause === true,
      reason: res.non_counting_reason ?? null,
    };
  } catch (e) {
    holzenLog.pause('pause_v2 log_companion failed', {
      companionType: params.companionType,
      action: params.action,
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
