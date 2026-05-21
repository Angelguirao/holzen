import { invokeEdge } from '@/lib/invoke-edge';

/** `companion-orchestrate` edge invoke (`invokeEdge` preserves `x-cid`). */
export function invokeCompanionOrchestrate(body: Record<string, unknown>) {
  return invokeEdge('companion-orchestrate', { body });
}
