import { useMemo } from 'react';
import { invokeEdge } from '@/lib/invoke-edge';
import type { RunCompanionSlotOrchestratePorts } from '@/features/pause/public';
import { loadActiveOrchestrateSources } from '@/features/pause/public-queries';

/** Stable I/O ports for `runCompanionSlotOrchestrate` (`invokeEdge` + x-cid, source queries). */
export function useCompanionSlotOrchestratePorts(): RunCompanionSlotOrchestratePorts {
  return useMemo(
    () => ({
      loadSignalSources: () => loadActiveOrchestrateSources('signal'),
      loadGroundingSources: () => loadActiveOrchestrateSources('grounding'),
      invoke: (body: Record<string, unknown>) =>
        invokeEdge('companion-orchestrate', { body }),
    }),
    [],
  );
}
