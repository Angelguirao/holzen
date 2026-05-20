import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import {
  buildLazyFetchOrchestrateBody,
  buildRegenerateOrchestrateBody,
  type CompanionOrchestrateSessionContext,
  type CompanionOrchestrateSourceWire,
} from './build-companion-orchestrate-body';
import {
  resolveCompanionOrchestrateInvokeFailure,
  type CompanionOrchestrateInvokeFailure,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-invoke-error';
import { isFilledOrchestrateSlot, readOrchestrateSlotBody } from './orchestrate-slot-apply';
import { getRecencyHints } from '@/features/pause/application/use-cases/ritual/frame/recency-hints';

export type CompanionSlotOrchestrateMode = 'lazy_fetch' | 'regenerate';

const ORCHESTRATE_UNAVAILABLE =
  'This AI feature is temporarily unavailable. Please try again in a minute.';

export type RunCompanionSlotOrchestrateSuccess = {
  status: 'success';
  body: Record<string, unknown>;
  hasFilledSlot: boolean;
};

export type RunCompanionSlotOrchestrateFailure = {
  status: 'failure';
  failure: CompanionOrchestrateInvokeFailure;
};

export type RunCompanionSlotOrchestrateResult =
  | RunCompanionSlotOrchestrateSuccess
  | RunCompanionSlotOrchestrateFailure;

export interface RunCompanionSlotOrchestratePorts {
  loadSignalSources?: () => Promise<CompanionOrchestrateSourceWire[] | undefined>;
  loadGroundingSources?: () => Promise<CompanionOrchestrateSourceWire[] | undefined>;
  invoke: (body: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

/** Shared lazy-fetch / regenerate `companion-orchestrate` invoke (body build + failure classify). */
export async function runCompanionSlotOrchestrate(
  mode: CompanionSlotOrchestrateMode,
  slot: RegenerateCompanionSlot,
  session: CompanionOrchestrateSessionContext,
  ports: RunCompanionSlotOrchestratePorts,
): Promise<RunCompanionSlotOrchestrateResult> {
  const recency = getRecencyHints();
  const signalSources =
    slot === 'signal' && ports.loadSignalSources ? await ports.loadSignalSources() : undefined;
  const groundingSources =
    slot === 'grounding' && ports.loadGroundingSources
      ? await ports.loadGroundingSources()
      : undefined;

  const requestBody =
    mode === 'lazy_fetch'
      ? buildLazyFetchOrchestrateBody(session, slot, { recency, signalSources, groundingSources })
      : buildRegenerateOrchestrateBody(session, slot, { recency, signalSources, groundingSources });

  const { data, error: fnError } = await ports.invoke(requestBody);
  const responseBody = data as Record<string, unknown> | null;
  const failure = await resolveCompanionOrchestrateInvokeFailure(
    fnError,
    responseBody,
    mode,
    ORCHESTRATE_UNAVAILABLE,
  );
  if (failure) {
    return { status: 'failure', failure };
  }

  const slotResult = readOrchestrateSlotBody(responseBody ?? {}, slot);
  return {
    status: 'success',
    body: responseBody ?? {},
    hasFilledSlot: isFilledOrchestrateSlot(slotResult),
  };
}
