import type { InterventionState } from '@/features/pause/domain/companion-orchestrate';
import type { ParsedPauseArtifactCache } from './artifact-cache-parse';
import type { CompanionOrchestrateSessionContext } from './build-companion-orchestrate-body';
import { applyCompanionInterventionInvokeOutcome } from './apply-companion-intervention-invoke-outcome';
import {
  logCompanionInterventionInvoke,
  logCompanionInterventionSkippedIdempotency,
} from './companion-intervention-telemetry';
import { hydrateCompanionSlotsFromArtifactCache } from './hydrate-companion-slots-from-artifact-cache';
import { hasInvokedIntervention, runOnceIntervention } from './intervention-idempotency';
import type { CompanionSlotCommitters, CompanionSlotRelaxations } from './orchestrate-slot-apply';

export type RunCompanionInterventionBootstrapResult =
  | { status: 'cached' }
  | { status: 'skipped_idempotency' }
  | { status: 'session_unavailable' }
  | { status: 'success' }
  | { status: 'error' };

export type RunCompanionInterventionBootstrapPorts = {
  fetchArtifactCache: (pauseInstanceId: string) => Promise<ParsedPauseArtifactCache>;
  loadOrchestrateSession: () => Promise<CompanionOrchestrateSessionContext | null>;
  invokeIntervention: (
    session: CompanionOrchestrateSessionContext,
  ) => Promise<{ data: unknown; error: unknown }>;
};

export type RunCompanionInterventionBootstrapInput = {
  pauseInstanceId: string;
  fetchedSlots: Set<string>;
  slotCommitters: CompanionSlotCommitters;
  setCacheRelaxations: (update: (prev: CompanionSlotRelaxations) => CompanionSlotRelaxations) => void;
  setIntervention: (value: InterventionState) => void;
};

/**
 * Cache hydrate → idempotency gate → single intervention `companion-orchestrate` invoke.
 * Caller owns React loading/error flags.
 */
export async function runCompanionInterventionBootstrap(
  input: RunCompanionInterventionBootstrapInput,
  ports: RunCompanionInterventionBootstrapPorts,
): Promise<RunCompanionInterventionBootstrapResult> {
  const { pauseInstanceId, fetchedSlots, slotCommitters, setCacheRelaxations, setIntervention } =
    input;

  const cached = await ports.fetchArtifactCache(pauseInstanceId);
  const { hasCachedIntervention } = hydrateCompanionSlotsFromArtifactCache({
    cached,
    fetchedSlots,
    committers: slotCommitters,
    setIntervention,
  });
  if (hasCachedIntervention) {
    return { status: 'cached' };
  }

  if (hasInvokedIntervention(pauseInstanceId)) {
    logCompanionInterventionSkippedIdempotency(pauseInstanceId);
    return { status: 'skipped_idempotency' };
  }

  logCompanionInterventionInvoke(pauseInstanceId);

  const orchestrateSession = await ports.loadOrchestrateSession();
  if (!orchestrateSession) {
    return { status: 'session_unavailable' };
  }

  const { data, error: fnError } = await runOnceIntervention(pauseInstanceId, () =>
    ports.invokeIntervention(orchestrateSession),
  );

  const outcome = await applyCompanionInterventionInvokeOutcome({
    pauseInstanceId,
    data,
    fnError,
    setIntervention,
    fetchedSlots,
    slotCommitters,
    setCacheRelaxations,
  });

  return outcome.status === 'success' ? { status: 'success' } : { status: 'error' };
}
