import type { InterventionState } from '@/legacy/pause-featured-intervention/domain/intervention-types';
import { resolveCompanionOrchestrateInvokeFailure } from '@/features/pause/application/use-cases/ritual/frame/orchestrate-invoke-error';
import {
  isFilledOrchestrateSlot,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import {
  logCompanionInterventionInvokeFailed,
  logCompanionInterventionInvokeOk,
  logCompanionInterventionSignalHydrated,
} from './companion-intervention-telemetry';
import { hydrateOrchestrateSlotsFromInterventionResponse } from './intervention-slot-hydrate';

const INTERVENTION_UNAVAILABLE =
  'This AI feature is temporarily unavailable. Please try again in a minute.';

export type ApplyCompanionInterventionInvokeOutcomeInput = {
  pauseInstanceId: string;
  data: unknown;
  fnError: unknown;
  setIntervention: (value: InterventionState) => void;
  fetchedSlots: Set<string>;
  slotCommitters: CompanionSlotCommitters;
  setCacheRelaxations: (update: (prev: CompanionSlotRelaxations) => CompanionSlotRelaxations) => void;
};

export type ApplyCompanionInterventionInvokeOutcomeResult =
  | { status: 'success' }
  | { status: 'error' };

export async function applyCompanionInterventionInvokeOutcome({
  pauseInstanceId,
  data,
  fnError,
  setIntervention,
  fetchedSlots,
  slotCommitters,
  setCacheRelaxations,
}: ApplyCompanionInterventionInvokeOutcomeInput): Promise<ApplyCompanionInterventionInvokeOutcomeResult> {
  const body = data as Record<string, unknown> | null;
  const fnErrorMessage =
    fnError != null && typeof fnError === 'object' && 'message' in fnError
      ? String((fnError as { message?: unknown }).message ?? null)
      : null;

  const interventionFailure = await resolveCompanionOrchestrateInvokeFailure(
    fnError,
    body,
    'intervention',
    INTERVENTION_UNAVAILABLE,
  );
  if (interventionFailure) {
    logCompanionInterventionInvokeFailed(pauseInstanceId, fnErrorMessage, interventionFailure);
    return { status: 'error' };
  }

  if (!body?.intervention) {
    return { status: 'error' };
  }

  setIntervention(body.intervention as InterventionState);
  logCompanionInterventionInvokeOk(pauseInstanceId, true);

  const orchestrateBody = (data ?? {}) as Record<string, unknown>;
  const sigSlot = hydrateOrchestrateSlotsFromInterventionResponse(
    orchestrateBody,
    fetchedSlots,
    slotCommitters,
    setCacheRelaxations,
  );
  if (isFilledOrchestrateSlot(sigSlot)) {
    logCompanionInterventionSignalHydrated(pauseInstanceId, sigSlot);
  }

  return { status: 'success' };
}
