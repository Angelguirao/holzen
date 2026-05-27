import { loadActiveOrchestrateSources } from '@/features/pause/infrastructure/companion/orchestrate-sources';
import { invokeCompanionOrchestrate } from '@/features/pause/infrastructure/edge/companion-orchestrate-edge';
import type { CompanionOrchestrator } from '@/features/pause/ports/companion-orchestrator';

/** Default `CompanionOrchestrator` — catalog sources + `companion-orchestrate` via `invokeEdge`. */
export const supabaseCompanionOrchestrator: CompanionOrchestrator = {
  loadSignalSources: () => loadActiveOrchestrateSources('signal'),
  loadGroundingSources: () => loadActiveOrchestrateSources('grounding'),
  invoke: (body) => invokeCompanionOrchestrate(body),
};

/** @deprecated Prefer `supabaseCompanionOrchestrator` from this module (presentation imports infrastructure directly). */
export function createCompanionSlotOrchestratePorts(): CompanionOrchestrator {
  return supabaseCompanionOrchestrator;
}
