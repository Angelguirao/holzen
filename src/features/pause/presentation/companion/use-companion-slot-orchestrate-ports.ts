import { useMemo } from 'react';
import type { CompanionOrchestrator } from '@/features/pause/ports/companion-orchestrator';
import { supabaseCompanionOrchestrator } from '@/features/pause/public-queries';

/** Stable I/O ports for `runCompanionSlotOrchestrate` (`invokeEdge` + x-cid, source queries). */
export function useCompanionSlotOrchestratePorts(): CompanionOrchestrator {
  return useMemo(() => supabaseCompanionOrchestrator, []);
}
