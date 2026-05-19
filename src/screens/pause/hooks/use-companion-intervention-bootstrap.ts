import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';
import { invokeEdge } from '@/lib/invoke-edge';
import { holzenLog } from '@/lib/holzen-console';
import type { InterventionState } from '@/features/pause/public';
import { fetchParsedPauseArtifactCache } from '@/features/pause/public-queries';
import { loadMoodHistoryForOrchestrate } from '@/features/pause/public-queries';
import {
  buildCompanionOrchestrateSessionFromRitual,
  buildInterventionOrchestrateBody,
  hasInvokedIntervention,
  hydrateCompanionSlotsFromArtifactCache,
  hydrateOrchestrateSlotsFromInterventionResponse,
  isFilledOrchestrateSlot,
  resolveCompanionOrchestrateInvokeFailure,
  runOnceIntervention,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/public';

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

  useEffect(() => {
    if (!pauseInstanceId) return;

    const key = `${pauseInstanceId}:${retryCount}`;
    if (interventionFetchKeyRef.current === key) return;
    interventionFetchKeyRef.current = key;

    let cancelled = false;
    setInterventionLoading(true);
    setInterventionError(false);

    (async () => {
      try {
        const cached = await fetchParsedPauseArtifactCache(pauseInstanceId);
        if (cancelled) return;

        const { hasCachedIntervention } = hydrateCompanionSlotsFromArtifactCache({
          cached,
          fetchedSlots: fetchedSlotsRef.current,
          committers: slotCommitters,
          setIntervention,
        });
        if (hasCachedIntervention) {
          setInterventionLoading(false);
          return;
        }

        if (hasInvokedIntervention(pauseInstanceId)) {
          holzenLog.companion('orchestrate intervention skipped (idempotency)', {
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
          });
          interventionSkippedRef.current = true;
          setInterventionLoading(false);
          return;
        }

        const moodHistory = await loadMoodHistoryForOrchestrate();

        holzenLog.companion('orchestrate invoke (intervention only)', {
          holzenInvokeSource: 'browser_pause_intervention',
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
        });

        const orchestrateSession = buildCompanionOrchestrateSessionFromRitual({
          pauseInstanceId,
          context,
          language,
          reflectionMessage,
          mood,
          severityNumber,
          moodHistory,
        });
        const { data, error: fnError } = await runOnceIntervention(pauseInstanceId, () =>
          invokeEdge('companion-orchestrate', {
            body: buildInterventionOrchestrateBody(orchestrateSession),
          }),
        );

        if (cancelled) return;

        const body = data as Record<string, unknown> | null;
        const interventionFailure = await resolveCompanionOrchestrateInvokeFailure(
          fnError,
          body,
          'intervention',
          'This AI feature is temporarily unavailable. Please try again in a minute.',
        );
        if (interventionFailure) {
          holzenLog.companion('orchestrate intervention invoke failed', {
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
            fnError: fnError?.message ?? null,
            bodyError: interventionFailure.userMessage,
            bodyCode: interventionFailure.code,
          });
          setInterventionError(true);
          setInterventionLoading(false);
          return;
        }

        if (body?.intervention) {
          setIntervention(body.intervention as InterventionState);
        } else {
          setInterventionError(true);
        }
        setInterventionLoading(false);

        holzenLog.companion('orchestrate intervention ok', {
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          hasIntervention: Boolean(body?.intervention),
        });

        const orchestrateBody = (data ?? {}) as Record<string, unknown>;
        const sigSlot = hydrateOrchestrateSlotsFromInterventionResponse(
          orchestrateBody,
          fetchedSlotsRef.current,
          slotCommitters,
          setCacheRelaxations,
        );
        if (isFilledOrchestrateSlot(sigSlot)) {
          holzenLog.companion('hydrated signal from intervention response', {
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
            source: sigSlot.source,
            cacheRelaxation: sigSlot.cacheRelaxation ?? null,
          });
        }
      } catch (e) {
        console.error('[useCompanionInterventionBootstrap] intervention fetch failed', e);
        setInterventionError(true);
      } finally {
        if (!cancelled) setInterventionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
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
  ]);

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
