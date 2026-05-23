/**
 * CI cluster anchor for companion slot orchestrate invoke (§3).
 * Use case lives in `run-companion-slot-orchestrate`; re-export for presentation I/O.
 */
export {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
} from './run-companion-slot-orchestrate';
export type { CompanionOrchestrateSessionContext } from './build-companion-orchestrate-body';
