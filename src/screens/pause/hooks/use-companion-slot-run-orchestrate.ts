import { useCallback } from 'react';
import {
  applyCompanionSlotOrchestrateOutcome,
  logCompanionSlotOrchestrateInvoke,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
  type ApplyCompanionSlotOrchestrateFailureUiPorts,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
  type CompanionSlotOrchestrateMode,
  type CompanionSlotRelaxations,
  type RegenerateCompanionSlot,
  type RunCompanionSlotOrchestratePorts,
} from '@/features/pause/public';
import { useCompanionOrchestrateSession } from '@/screens/pause/hooks/use-companion-orchestrate-session';

export type UseCompanionSlotRunOrchestrateParams = {
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
  language: string;
  slotOrchestratePorts: RunCompanionSlotOrchestratePorts;
  failureUiPorts: ApplyCompanionSlotOrchestrateFailureUiPorts;
  toast: (props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => void;
  refreshSubscription: () => void | Promise<void>;
  setCacheIds: React.Dispatch<React.SetStateAction<CompanionSlotCacheIds>>;
  setCacheRelaxations: React.Dispatch<React.SetStateAction<CompanionSlotRelaxations>>;
  slotCommitters: CompanionSlotCommitters;
  companionSlotLoadingSetters: CompanionSlotLoadingSetters;
  companionSlotErrorSetters: CompanionSlotErrorSetters;
};

/** Runs one lazy-fetch or regenerate `companion-orchestrate` cycle for a slot. */
export function useCompanionSlotRunOrchestrate({
  pauseInstanceId,
  context,
  reflectionMessage,
  mood,
  severityNumber,
  language,
  slotOrchestratePorts,
  failureUiPorts,
  toast,
  refreshSubscription,
  setCacheIds,
  setCacheRelaxations,
  slotCommitters,
  companionSlotLoadingSetters,
  companionSlotErrorSetters,
}: UseCompanionSlotRunOrchestrateParams) {
  const buildOrchestrateSession = useCompanionOrchestrateSession({
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
  });

  const runSlotOrchestrate = useCallback(
    async (slot: RegenerateCompanionSlot, mode: CompanionSlotOrchestrateMode) => {
      if (!pauseInstanceId) return;

      setCompanionSlotLoading(slot, companionSlotLoadingSetters, true);
      setCompanionSlotError(slot, companionSlotErrorSetters, false);

      try {
        const orchestrateSession = await buildOrchestrateSession();
        if (!orchestrateSession) return;

        logCompanionSlotOrchestrateInvoke(mode, slot, pauseInstanceId);
        trackCompanionGenerationInitiated(slot, mode);

        const result = await runCompanionSlotOrchestrate(
          mode,
          slot,
          orchestrateSession,
          slotOrchestratePorts,
        );

        applyCompanionSlotOrchestrateOutcome({
          mode,
          slot,
          pauseInstanceId,
          result,
          setCacheIds,
          slotCommitters,
          setCacheRelaxations,
          failureUiPorts,
          setSlotError: (error) => setCompanionSlotError(slot, companionSlotErrorSetters, error),
        });
      } catch (e) {
        console.error(`[useCompanionSlotRunOrchestrate] ${mode}`, slot, e);
        if (mode === 'regenerate') {
          toast({ title: 'Regenerate failed', description: 'Network error', variant: 'destructive' });
        }
        setCompanionSlotError(slot, companionSlotErrorSetters, true);
      } finally {
        setCompanionSlotLoading(slot, companionSlotLoadingSetters, false);
        if (mode === 'lazy_fetch') {
          void refreshSubscription();
        }
      }
    },
    [
      pauseInstanceId,
      buildOrchestrateSession,
      slotOrchestratePorts,
      companionSlotLoadingSetters,
      companionSlotErrorSetters,
      slotCommitters,
      setCacheIds,
      setCacheRelaxations,
      failureUiPorts,
      toast,
      refreshSubscription,
    ],
  );

  return { runSlotOrchestrate };
}
