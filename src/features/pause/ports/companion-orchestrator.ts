import type {
  CompanionOrchestrateSessionContext,
  CompanionOrchestrateSourceWire,
} from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';

/** Port for frame ritual: `companion-orchestrate` edge invoke + optional source catalogs. */
export interface CompanionOrchestrator {
  loadSignalSources?(): Promise<CompanionOrchestrateSourceWire[] | undefined>;
  loadGroundingSources?(): Promise<CompanionOrchestrateSourceWire[] | undefined>;
  invoke(body: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
  invokeIntervention(
    session: CompanionOrchestrateSessionContext,
  ): Promise<{ data: unknown; error: unknown }>;
}
