import { invokeEdge } from '@/lib/invoke-edge';
import {
  buildInterventionOrchestrateBody,
  type CompanionOrchestrateSessionContext,
} from '../../application/use-cases/ritual/frame/build-companion-orchestrate-body';
import type { RunCompanionSlotOrchestratePorts } from '../../application/use-cases/companion/run-companion-slot-orchestrate';
import { loadActiveOrchestrateSources } from '../companion/orchestrate-sources';

/** `companion-orchestrate` edge invoke (`invokeEdge` preserves `x-cid`). */
export function invokeCompanionOrchestrate(body: Record<string, unknown>) {
  return invokeEdge('companion-orchestrate', { body });
}

/** Intervention-only body (`useIntervention: true`, all slot flags off). */
export function invokeCompanionIntervention(session: CompanionOrchestrateSessionContext) {
  return invokeCompanionOrchestrate(buildInterventionOrchestrateBody(session));
}

/** Default I/O ports for `runCompanionSlotOrchestrate` (lazy-fetch / regenerate). */
export function createCompanionSlotOrchestratePorts(): RunCompanionSlotOrchestratePorts {
  return {
    loadSignalSources: () => loadActiveOrchestrateSources('signal'),
    loadGroundingSources: () => loadActiveOrchestrateSources('grounding'),
    invoke: (body) => invokeCompanionOrchestrate(body),
  };
}
