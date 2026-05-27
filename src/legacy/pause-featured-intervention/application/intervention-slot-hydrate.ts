import type { CompanionOrchestrateSlotResult, RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import {
  hydrateOrchestrateSlotIfNew,
  readOrchestrateSlotBody,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';

export const INTERVENTION_RESPONSE_COMPANION_SLOTS: readonly RegenerateCompanionSlot[] = [
  'grounding',
  'history',
  'zoomOut',
  'signal',
];

export function hydrateOrchestrateSlotsFromInterventionResponse(
  orchestrateBody: Record<string, unknown>,
  fetchedSlots: Set<string>,
  committers: CompanionSlotCommitters,
  setCacheRelaxations?: (fn: (prev: CompanionSlotRelaxations) => CompanionSlotRelaxations) => void,
): CompanionOrchestrateSlotResult | null {
  for (const slot of INTERVENTION_RESPONSE_COMPANION_SLOTS) {
    hydrateOrchestrateSlotIfNew(
      slot,
      readOrchestrateSlotBody(orchestrateBody, slot),
      fetchedSlots,
      committers,
      setCacheRelaxations,
    );
  }
  return readOrchestrateSlotBody(orchestrateBody, 'signal');
}
