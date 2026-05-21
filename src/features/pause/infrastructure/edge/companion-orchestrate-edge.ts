import { invokeEdge } from '@/lib/invoke-edge';
import {
  buildInterventionOrchestrateBody,
  type CompanionOrchestrateSessionContext,
} from '../../application/use-cases/ritual/frame/build-companion-orchestrate-body';
/** `companion-orchestrate` edge invoke (`invokeEdge` preserves `x-cid`). */
export function invokeCompanionOrchestrate(body: Record<string, unknown>) {
  return invokeEdge('companion-orchestrate', { body });
}

/** Intervention-only body (`useIntervention: true`, all slot flags off). */
export function invokeCompanionIntervention(session: CompanionOrchestrateSessionContext) {
  return invokeCompanionOrchestrate(buildInterventionOrchestrateBody(session));
}
