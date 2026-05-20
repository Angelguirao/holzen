import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import {
  applyCompanionSlotOrchestrateFailureUi,
  resolveCompanionSlotOrchestrateFailureUi,
  type ApplyCompanionSlotOrchestrateFailureUiPorts,
} from './companion-slot-orchestrate-failure-ui';
import {
  logCompanionSlotOrchestrateEmpty,
  logCompanionSlotOrchestrateFailed,
  logCompanionSlotOrchestrateFilled,
} from './companion-slot-orchestrate-telemetry';
import { tryApplyOrchestrateSlotFromBody } from './orchestrate-slot-apply';
import type {
  CompanionSlotCacheIds,
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from './orchestrate-slot-apply';
import type {
  CompanionSlotOrchestrateMode,
  RunCompanionSlotOrchestrateResult,
} from './run-companion-slot-orchestrate';

export type ApplyCompanionSlotOrchestrateOutcomeInput = {
  mode: CompanionSlotOrchestrateMode;
  slot: RegenerateCompanionSlot;
  pauseInstanceId: string;
  result: RunCompanionSlotOrchestrateResult;
  setCacheIds: (update: (prev: CompanionSlotCacheIds) => CompanionSlotCacheIds) => void;
  slotCommitters: CompanionSlotCommitters;
  setCacheRelaxations: (update: (prev: CompanionSlotRelaxations) => CompanionSlotRelaxations) => void;
  failureUiPorts: ApplyCompanionSlotOrchestrateFailureUiPorts;
  setSlotError: (error: boolean) => void;
};

/** Applies lazy-fetch / regenerate orchestrate result to slot UI + paywall/toast adapters. */
export function applyCompanionSlotOrchestrateOutcome({
  mode,
  slot,
  pauseInstanceId,
  result,
  setCacheIds,
  slotCommitters,
  setCacheRelaxations,
  failureUiPorts,
  setSlotError,
}: ApplyCompanionSlotOrchestrateOutcomeInput): void {
  if (result.status === 'failure') {
    logCompanionSlotOrchestrateFailed(mode, slot, pauseInstanceId, result.failure);
    applyCompanionSlotOrchestrateFailureUi(
      resolveCompanionSlotOrchestrateFailureUi(result.failure, mode),
      slot,
      failureUiPorts,
    );
    setSlotError(true);
    return;
  }

  const filled = tryApplyOrchestrateSlotFromBody(
    result.body,
    slot,
    setCacheIds,
    slotCommitters,
    setCacheRelaxations,
  );
  if (filled) {
    logCompanionSlotOrchestrateFilled(mode, slot, pauseInstanceId);
  } else {
    logCompanionSlotOrchestrateEmpty(mode, slot, pauseInstanceId);
    setSlotError(true);
  }
}
