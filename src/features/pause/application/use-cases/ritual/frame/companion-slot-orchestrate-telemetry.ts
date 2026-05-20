import { holzenLog } from '@/lib/holzen-console';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import type { CompanionOrchestrateInvokeFailure } from '@/features/pause/application/use-cases/ritual/frame/orchestrate-invoke-error';
import type { CompanionSlotOrchestrateMode } from '@/features/pause/application/use-cases/companion/run-companion-slot-orchestrate';

function pauseInstancePrefix(pauseInstanceId: string): string {
  return pauseInstanceId.slice(0, 8);
}

/** Dev / debug channel log before `companion-orchestrate` invoke. */
export function logCompanionSlotOrchestrateInvoke(
  mode: CompanionSlotOrchestrateMode,
  slot: RegenerateCompanionSlot,
  pauseInstanceId: string,
): void {
  holzenLog.companion(mode === 'lazy_fetch' ? 'lazy fetch orchestrate invoke' : 'regenerate orchestrate invoke', {
    slot,
    holzenInvokeSource: mode === 'lazy_fetch' ? 'browser_lazy_fetch' : 'browser_regenerate',
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
  });
}

export function logCompanionSlotOrchestrateFailed(
  mode: CompanionSlotOrchestrateMode,
  slot: RegenerateCompanionSlot,
  pauseInstanceId: string,
  failure: CompanionOrchestrateInvokeFailure,
): void {
  holzenLog.companion(
    mode === 'lazy_fetch' ? 'lazy fetch orchestrate failed' : 'regenerate orchestrate failed',
    {
      slot,
      pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
      bodyError: failure.userMessage,
      bodyCode: failure.code,
    },
  );
}

export function logCompanionSlotOrchestrateFilled(
  mode: CompanionSlotOrchestrateMode,
  slot: RegenerateCompanionSlot,
  pauseInstanceId: string,
): void {
  holzenLog.companion(mode === 'lazy_fetch' ? 'lazy fetch slot filled' : 'regenerate slot filled', {
    slot,
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
  });
}

export function logCompanionSlotOrchestrateEmpty(
  mode: CompanionSlotOrchestrateMode,
  slot: RegenerateCompanionSlot,
  pauseInstanceId: string,
): void {
  holzenLog.companion(mode === 'lazy_fetch' ? 'lazy fetch empty or error slot' : 'regenerate empty slot', {
    slot,
    pause_instance_prefix: pauseInstancePrefix(pauseInstanceId),
  });
}
