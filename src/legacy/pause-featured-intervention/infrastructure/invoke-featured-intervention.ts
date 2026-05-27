import { buildInterventionOrchestrateBody } from '@/legacy/pause-featured-intervention/application/build-intervention-orchestrate-body';
import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import { invokeCompanionOrchestrate } from '@/features/pause/infrastructure/edge/companion-orchestrate-edge';

export function invokeFeaturedInterventionOrchestrate(session: CompanionOrchestrateSessionContext) {
  return invokeCompanionOrchestrate(buildInterventionOrchestrateBody(session));
}
