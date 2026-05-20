import { holzenLog } from '@/lib/holzen-console';
import type { CompanionOrchestrateInvokeFailure } from '@/features/pause/application/use-cases/ritual/frame/orchestrate-invoke-error';
import type { CompanionOrchestrateSlotResult } from '@/features/pause/application/use-cases/companion/orchestrate-slot-apply';

function pauseInstancePrefix(pauseInstanceId: string): string {
  return pauseInstanceId.slice(0, 8);
}

export function logCompanionInterventionSkippedIdempotency(pauseInstanceId: string): void {
  holzenLog.companion('orchestrate intervention skipped (idempotency)', {
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
  });
}

export function logCompanionInterventionInvoke(pauseInstanceId: string): void {
  holzenLog.companion('orchestrate invoke (intervention only)', {
    holzenInvokeSource: 'browser_pause_intervention',
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
  });
}

export function logCompanionInterventionInvokeFailed(
  pauseInstanceId: string,
  fnErrorMessage: string | null,
  failure: CompanionOrchestrateInvokeFailure,
): void {
  holzenLog.companion('orchestrate intervention invoke failed', {
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
    fnError: fnErrorMessage,
    bodyError: failure.userMessage,
    bodyCode: failure.code,
  });
}

export function logCompanionInterventionInvokeOk(
  pauseInstanceId: string,
  hasIntervention: boolean,
): void {
  holzenLog.companion('orchestrate intervention ok', {
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
    hasIntervention,
  });
}

export function logCompanionInterventionSignalHydrated(
  pauseInstanceId: string,
  sigSlot: CompanionOrchestrateSlotResult,
): void {
  holzenLog.companion('hydrated signal from intervention response', {
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
    source: sigSlot.source,
    cacheRelaxation: sigSlot.cacheRelaxation ?? null,
  });
}
