import { buildInterventionOrchestrateBody } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import { loadActiveOrchestrateSources } from '@/features/pause/infrastructure/companion/orchestrate-sources';
import { invokeCompanionOrchestrate } from '@/features/pause/infrastructure/edge/companion-orchestrate-edge';
import type { CompanionOrchestrator } from '@/features/pause/ports/companion-orchestrator';

/** Default `CompanionOrchestrator` — catalog sources + `companion-orchestrate` via `invokeEdge`. */
export const supabaseCompanionOrchestrator: CompanionOrchestrator = {
  loadSignalSources: () => loadActiveOrchestrateSources('signal'),
  loadGroundingSources: () => loadActiveOrchestrateSources('grounding'),
  invoke: (body) => invokeCompanionOrchestrate(body),
  invokeIntervention: (session) =>
    invokeCompanionOrchestrate(buildInterventionOrchestrateBody(session)),
};

/** @deprecated Prefer `supabaseCompanionOrchestrator` from `public-queries`. */
export function createCompanionSlotOrchestratePorts(): CompanionOrchestrator {
  return supabaseCompanionOrchestrator;
}
