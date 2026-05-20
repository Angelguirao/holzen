import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';
import type { InterventionState } from '@/features/pause/public';
import type {
  CompanionSlotAutosaveParams,
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from '@/features/pause/public';
import { useCompanionOrchestrateSession } from '@/features/pause/public-hooks';
import { useCompanionInterventionFetch } from '@/screens/pause/hooks/use-companion-intervention-fetch';

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
  autoSaveToLibrary,
  slotCommitters,
  fetchedSlotsRef,
  setCacheRelaxations,
}: UseCompanionInterventionBootstrapParams) {
  const [intervention, setIntervention] = useState<InterventionState | null>(null);
  const [interventionLoading, setInterventionLoading] = useState(false);
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

    if (!pauseInstanceId) {
      setInterventionLoading(false);
      return;
    }
    setInterventionLoading(true);
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
    setInterventionLoading,
    setInterventionError,
    setIntervention,
    loadOrchestrateSession,
    slotCommitters,
    fetchedSlotsRef,
    setCacheRelaxations,
  });

  return {
    intervention,
    interventionLoading,
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
