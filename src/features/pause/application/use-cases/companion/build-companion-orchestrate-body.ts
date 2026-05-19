import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import type { CompanionRecencyHintsPayload } from './recency-hints';

export type CompanionOrchestrateSourceWire = {
  name: string;
  type: string;
  url: string;
};

export type CompanionOrchestrateMoodHistoryEntry = {
  mood: string;
  outcome?: string | null;
};

/** Shared pause/session fields sent on every `companion-orchestrate` invoke from the ritual UI. */
export interface CompanionOrchestrateSessionContext {
  pauseInstanceId: string;
  context: string;
  language: string;
  reflectionMessage: string;
  mood: string | null;
  severity: number;
  moodHistory: CompanionOrchestrateMoodHistoryEntry[];
}

const ALL_SLOTS_DISABLED = {
  enableSignal: false,
  enableGrounding: false,
  enableHistory: false,
  enableZoomOut: false,
} as const;

function slotEnableFlags(slot: RegenerateCompanionSlot) {
  return {
    enableSignal: slot === 'signal',
    enableGrounding: slot === 'grounding',
    enableHistory: slot === 'history',
    enableZoomOut: slot === 'zoomOut',
  };
}

export function buildInterventionOrchestrateBody(
  session: CompanionOrchestrateSessionContext,
): Record<string, unknown> {
  return {
    holzenInvokeSource: 'browser_pause_intervention',
    ...session,
    ...ALL_SLOTS_DISABLED,
    useIntervention: true,
  };
}

export function buildLazyFetchOrchestrateBody(
  session: CompanionOrchestrateSessionContext,
  slot: RegenerateCompanionSlot,
  options: {
    recency: CompanionRecencyHintsPayload;
    signalSources?: CompanionOrchestrateSourceWire[];
    groundingSources?: CompanionOrchestrateSourceWire[];
  },
): Record<string, unknown> {
  return {
    holzenInvokeSource: 'browser_lazy_fetch',
    ...session,
    signalSources: options.signalSources,
    groundingSources: options.groundingSources,
    ...options.recency,
    ...slotEnableFlags(slot),
    useIntervention: false,
  };
}

export function buildRegenerateOrchestrateBody(
  session: CompanionOrchestrateSessionContext,
  slot: RegenerateCompanionSlot,
  options: {
    recency: CompanionRecencyHintsPayload;
    signalSources?: CompanionOrchestrateSourceWire[];
    groundingSources?: CompanionOrchestrateSourceWire[];
  },
): Record<string, unknown> {
  return {
    holzenInvokeSource: 'browser_regenerate',
    ...session,
    regenerateOnly: slot,
    signalSources: options.signalSources,
    groundingSources: options.groundingSources,
    ...options.recency,
  };
}
