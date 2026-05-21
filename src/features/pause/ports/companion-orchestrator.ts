import type { CompanionOrchestrateSourceWire } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';

/** Port for frame companion slots: source queries + `companion-orchestrate` edge invoke. */
export interface CompanionOrchestrator {
  loadSignalSources?(): Promise<CompanionOrchestrateSourceWire[] | undefined>;
  loadGroundingSources?(): Promise<CompanionOrchestrateSourceWire[] | undefined>;
  invoke(body: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}
