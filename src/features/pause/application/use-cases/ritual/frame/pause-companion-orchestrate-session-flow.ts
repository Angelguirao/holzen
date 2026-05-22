/**
 * CI cluster anchor for companion orchestrate session load (§3).
 * Presentation: `pause-companion-orchestration-io.ts` imports `load-companion-orchestrate-session` directly.
 */
export {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from './load-companion-orchestrate-session';
