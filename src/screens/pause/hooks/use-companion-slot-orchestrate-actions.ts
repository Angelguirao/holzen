import { useCallback, useMemo } from 'react';
import { invokeEdge } from '@/lib/invoke-edge';
import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';
import {
  showLimitReachedToast,
} from '@/features/subscription/public-limits';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import {
  companionSlotToGenerationTaxonomy,
  resolveCompanionSlotOrchestrateFailureUi,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  tryApplyOrchestrateSlotFromBody,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/public';
import { loadActiveOrchestrateSources } from '@/features/pause/public-queries';
import { useCompanionOrchestrateSession } from '@/screens/pause/hooks/use-companion-orchestrate-session';

export interface UseCompanionSlotOrchestrateActionsParams {
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
  language: string;
  canAccessCompanion: () => boolean;
  applyOptimisticDecrement: (bucket: 'companion') => void;
  refreshSubscription: () => void | Promise<void>;
  toast: (props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => void;
  requirePro: (feature: 'companions') => boolean;
  startCheckout: () => void;
  fetchedSlotsRef: React.MutableRefObject<Set<string>>;
  setCacheIds: React.Dispatch<React.SetStateAction<CompanionSlotCacheIds>>;
  setCacheRelaxations: React.Dispatch<React.SetStateAction<CompanionSlotRelaxations>>;
  slotCommitters: CompanionSlotCommitters;
  companionSlotLoadingSetters: {
    setSignalLoading: (v: boolean) => void;
    setNudgeLoading: (v: boolean) => void;
    setHistoryLoading: (v: boolean) => void;
    setZoomOutLoading: (v: boolean) => void;
  };
  companionSlotErrorSetters: {
    setSignalError: (v: boolean) => void;
    setNudgeError: (v: boolean) => void;
    setHistoryError: (v: boolean) => void;
    setZoomOutError: (v: boolean) => void;
  };
}

/**
 * Lazy-fetch and regenerate companion slots via `companion-orchestrate` edge (`invokeEdge` + x-cid).
 */
export function useCompanionSlotOrchestrateActions({
  pauseInstanceId,
  context,
  reflectionMessage,
  mood,
  severityNumber,
  language,
  canAccessCompanion,
  applyOptimisticDecrement,
  refreshSubscription,
  toast,
  requirePro,
  startCheckout,
  fetchedSlotsRef,
  setCacheIds,
  setCacheRelaxations,
  slotCommitters,
  companionSlotLoadingSetters,
  companionSlotErrorSetters,
}: UseCompanionSlotOrchestrateActionsParams) {
  const slotOrchestratePorts = useMemo(
    () => ({
      loadSignalSources: () => loadActiveOrchestrateSources('signal'),
      loadGroundingSources: () => loadActiveOrchestrateSources('grounding'),
      invoke: (body: Record<string, unknown>) =>
        invokeEdge('companion-orchestrate', { body }),
    }),
    [],
  );

  const buildOrchestrateSession = useCompanionOrchestrateSession({
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
  });

  const runSlotOrchestrate = useCallback(
    async (slot: RegenerateCompanionSlot, mode: 'lazy_fetch' | 'regenerate') => {
      if (!pauseInstanceId) return;

      setCompanionSlotLoading(slot, companionSlotLoadingSetters, true);
      setCompanionSlotError(slot, companionSlotErrorSetters, false);

      try {
        const orchestrateSession = await buildOrchestrateSession();
        if (!orchestrateSession) return;

        holzenLog.companion(mode === 'lazy_fetch' ? 'lazy fetch orchestrate invoke' : 'regenerate orchestrate invoke', {
          slot,
          holzenInvokeSource: mode === 'lazy_fetch' ? 'browser_lazy_fetch' : 'browser_regenerate',
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
        });

        trackEvent('generation.initiated', {
          companion_type: companionSlotToGenerationTaxonomy(slot),
          source: mode === 'lazy_fetch' ? 'lazy' : 'regenerate',
        });

        const result = await runCompanionSlotOrchestrate(
          mode,
          slot,
          orchestrateSession,
          slotOrchestratePorts,
        );

        if (result.status === 'failure') {
          const failure = result.failure;
          holzenLog.companion(
            mode === 'lazy_fetch' ? 'lazy fetch orchestrate failed' : 'regenerate orchestrate failed',
            {
              slot,
              pause_instance_prefix: pauseInstanceId.slice(0, 8),
              bodyError: failure.userMessage,
              bodyCode: failure.code,
            },
          );
          const failureUi = resolveCompanionSlotOrchestrateFailureUi(failure, mode);
          if (failureUi.action === 'lazy_paywall_upgrade_required') {
            fetchedSlotsRef.current.delete(slot);
            requirePro('companions');
          } else if (failureUi.action === 'lazy_paywall_limit_reached') {
            fetchedSlotsRef.current.delete(slot);
            showLimitReachedToast({ feature: 'companion', startCheckout });
          } else {
            toast({
              title: failureUi.title,
              description: failureUi.description,
              variant: 'destructive',
            });
          }
          setCompanionSlotError(slot, companionSlotErrorSetters, true);
          return;
        }

        const filled = tryApplyOrchestrateSlotFromBody(
          result.body,
          slot,
          setCacheIds,
          slotCommitters,
          setCacheRelaxations,
        );
        if (filled) {
          holzenLog.companion(mode === 'lazy_fetch' ? 'lazy fetch slot filled' : 'regenerate slot filled', {
            slot,
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
          });
        } else {
          holzenLog.companion(mode === 'lazy_fetch' ? 'lazy fetch empty or error slot' : 'regenerate empty slot', {
            slot,
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
          });
          setCompanionSlotError(slot, companionSlotErrorSetters, true);
        }
      } catch (e) {
        console.error(`[useCompanionSlotOrchestrateActions] ${mode}`, slot, e);
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
      fetchedSlotsRef,
      requirePro,
      startCheckout,
      toast,
      refreshSubscription,
    ],
  );

  const fetchCompanion = useCallback(
    async (slot: RegenerateCompanionSlot) => {
      if (!pauseInstanceId) return;
      if (fetchedSlotsRef.current.has(slot)) return;
      if (!canAccessCompanion()) return;

      fetchedSlotsRef.current.add(slot);
      applyOptimisticDecrement('companion');
      await runSlotOrchestrate(slot, 'lazy_fetch');
    },
    [pauseInstanceId, canAccessCompanion, applyOptimisticDecrement, runSlotOrchestrate, fetchedSlotsRef],
  );

  const regenerateCompanion = useCallback(
    async (slot: RegenerateCompanionSlot) => {
      if (!pauseInstanceId) return;
      if (!canAccessCompanion()) return;
      await runSlotOrchestrate(slot, 'regenerate');
    },
    [pauseInstanceId, canAccessCompanion, runSlotOrchestrate],
  );

  const retrySlot = useCallback(
    (slot: RegenerateCompanionSlot) => {
      fetchedSlotsRef.current.delete(slot);
      void fetchCompanion(slot);
    },
    [fetchCompanion, fetchedSlotsRef],
  );

  const retryNudge = useCallback(() => retrySlot('grounding'), [retrySlot]);
  const retrySignal = useCallback(() => retrySlot('signal'), [retrySlot]);
  const retryZoomOut = useCallback(() => retrySlot('zoomOut'), [retrySlot]);
  const retryHistory = useCallback(() => retrySlot('history'), [retrySlot]);

  return {
    fetchCompanion,
    regenerateCompanion,
    retryNudge,
    retrySignal,
    retryZoomOut,
    retryHistory,
  };
}
