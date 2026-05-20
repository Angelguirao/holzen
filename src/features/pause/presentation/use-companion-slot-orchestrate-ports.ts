import { useMemo } from 'react';
import type { RunCompanionSlotOrchestratePorts } from '@/features/pause/application/use-cases/ritual/frame/run-companion-slot-orchestrate';
import { createCompanionSlotOrchestratePorts } from '@/features/pause/public-rpc';

/** Stable I/O ports for `runCompanionSlotOrchestrate` (`invokeEdge` + x-cid, source queries). */
export function useCompanionSlotOrchestratePorts(): RunCompanionSlotOrchestratePorts {
  return useMemo(() => createCompanionSlotOrchestratePorts(), []);
}
