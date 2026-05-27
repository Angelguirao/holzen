import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { toast as sonnerToast } from 'sonner';
import type { InterventionState } from '@/legacy/pause-featured-intervention/domain/intervention-types';
import type { CompanionSlotAutosaveParams } from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import type {
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import { useCompanionOrchestrateSession } from '@/features/pause/presentation/companion/use-companion-orchestrate-session';
import { useCompanionInterventionFetch } from './use-companion-intervention-fetch';

export interface UseCompanionInterventionBootstrapParams {
  pauseInstanceId?: string | null;
  retryCount: number;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
  language: string;
  autoSaveToLibrary: (params: CompanionSlotAutosaveParams) => void | Promise<void>;
  slotCommitters: CompanionSlotCommitters;
  fetchedSlotsRef: React.MutableRefObject<Set<string>>;
  setCacheRelaxations: React.Dispatch<React.SetStateAction<CompanionSlotRelaxations>>;
}

export function useCompanionInterventionBootstrap({
  pauseInstanceId,
  retryCount,
  context,
  reflectionMessage,
  mood,
  severityNumber,
  language,
  slotCommitters,
  fetchedSlotsRef,
  setCacheRelaxations,
}: UseCompanionInterventionBootstrapParams) {
  const [intervention, setIntervention] = useState<InterventionState | null>(null);
  const [interventionPending, startInterventionTransition] = useTransition();
  const [interventionError, setInterventionError] = useState(false);

  const interventionFetchKeyRef = useRef<string | null>(null);
  const interventionSkippedRef = useRef(false);
  const pendingRetryConfirmRef = useRef<string | null>(null);

  const loadOrchestrateSession = useCompanionOrchestrateSession({
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
  });

  useLayoutEffect(() => {
    setIntervention(null);
    setInterventionError(false);
    interventionSkippedRef.current = false;
    pendingRetryConfirmRef.current = null;
    interventionFetchKeyRef.current = null;
  }, [pauseInstanceId]);

  useEffect(() => {
    if (!intervention) return;
    if (!pendingRetryConfirmRef.current) return;
    if (pendingRetryConfirmRef.current !== pauseInstanceId) return;
    sonnerToast.success('New perspective loaded', {
      id: `intervention-retry:${pauseInstanceId}`,
    });
    pendingRetryConfirmRef.current = null;
    interventionSkippedRef.current = false;
  }, [intervention, pauseInstanceId]);

  useCompanionInterventionFetch({
    pauseInstanceId,
    retryCount,
    interventionFetchKeyRef,
    interventionSkippedRef,
    startInterventionTransition,
    setInterventionError,
    setIntervention,
    loadOrchestrateSession,
    slotCommitters,
    fetchedSlotsRef,
    setCacheRelaxations,
  });

  return {
    intervention,
    interventionLoading: interventionPending,
    interventionError,
    setIntervention,
    setInterventionError,
    interventionSkippedRef,
    pendingRetryConfirmRef,
    clearInterventionFetchDedupe: () => {
      interventionFetchKeyRef.current = null;
    },
  };
}
