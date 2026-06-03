import { useCallback } from 'react';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import {
  applyCompanionSlotOrchestrateOutcome,
  companionOrchestrator,
  logCompanionSlotOrchestrateInvoke,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  startCompanionSlotTransition,
  trackCompanionGenerationInitiated,
  type ApplyCompanionSlotOrchestrateFailureUiPorts,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotErrorSetters,
  type CompanionSlotOrchestrateMode,
  type CompanionSlotRelaxations,
  type CompanionSlotTransitionStarters,
} from './pause-companion-orchestrate-io';
import { useCompanionOrchestrateSession } from './use-companion-orchestrate-session';

export type UseCompanionSlotRunOrchestrateParams = {
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
  language: string;
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
  companionSlotTransitionStarters: CompanionSlotTransitionStarters;
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
  failureUiPorts,
  toast,
  refreshSubscription,
  setCacheIds,
  setCacheRelaxations,
  slotCommitters,
  companionSlotTransitionStarters,
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

      await new Promise<void>((resolve) => {
        startCompanionSlotTransition(slot, companionSlotTransitionStarters, async () => {
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
              companionOrchestrator,
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
            if (mode === 'lazy_fetch' || mode === 'regenerate') {
              void refreshSubscription();
            }
            resolve();
          }
        });
      });
    },
    [
      pauseInstanceId,
      buildOrchestrateSession,
      companionSlotTransitionStarters,
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
};
