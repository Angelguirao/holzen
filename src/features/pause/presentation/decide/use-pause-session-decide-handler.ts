import { useCallback } from 'react';
import { hapticFeedback } from '@/lib/haptics';
import { useAuth } from '@/features/auth/public';
import { getSessionQuote } from '@/features/pause/application/use-cases/session/wisdom-quotes';
import {
  formatReinforcementQuoteFromSession,
  logPauseOutcome,
  resolvePauseDecideOutcomeFlow,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/public-rpc';
import { clearSession } from '@/features/pause/infrastructure/session/persisted-session-storage';
import { invalidatePauseStatsDataForUser } from '@/features/pause/public-queries';
import type { UsePauseSessionDecideHandlerParams } from './pause-session-decide-handler-types';

export type { UsePauseSessionDecideHandlerParams } from './pause-session-decide-handler-types';

export function usePauseSessionDecideHandler(
  input: UsePauseSessionDecideHandlerParams,
): { handleDecide: (d: string) => Promise<void> } {
  const { user } = useAuth();
  const {
    decidingRef,
    pauseInstanceId,
    t,
    refreshSubscription,
    setDecision,
    dismissMessage,
    setPauseImpactData,
    setPhase,
    context,
    selectedMood,
    selectedMoodAfter,
    ritualEntry,
    breathingFirstCompleted,
    breathingSecondCompleted,
    feelIntensity,
    shiftIntensity,
    reflectionMessage,
    haiku,
  } = input;

  const handleDecide = useCallback(
    async (d: string) => {
      if (decidingRef.current) return;
      decidingRef.current = true;
      try {
        hapticFeedback('medium');

        const outcome = await logPauseOutcome({
          pauseInstanceId,
          decision: d,
        });

        const flow = resolvePauseDecideOutcomeFlow({
          outcome,
          decision: d,
          ritualSnapshot: {
            context,
            selectedMood,
            selectedMoodAfter,
            ritualEntry,
            breathingFirstCompleted,
            breathingSecondCompleted,
            feelIntensity,
            shiftIntensity,
            reflectionMessage,
            haiku,
          },
          reinforcementQuote: formatReinforcementQuoteFromSession(getSessionQuote()),
        });

        if (flow.kind === 'abort_sync_failed') {
          showPauseOutcomeSaveFailedToast(t);
          return;
        }

        if (flow.kind === 'abort_not_completed') {
          invalidatePauseStatsDataForUser(user?.id);
          showPauseOutcomeNotCompletedToast(t);
          void refreshSubscription();
          return;
        }

        if (flow.refreshSubscription) {
          void refreshSubscription();
        }

        setDecision(flow.decision);
        setPauseImpactData(flow.pauseImpactData);
        // Must commit `done` before `await dismissMessage()` — otherwise React can paint an
        // intermediate frame where the DB is already `completed` but `pauseSessionPhase` is
        // still `session`, and `usePauseSessionTerminalEntryRedirect` toasts + routes to archive.
        setPhase('done');
        await dismissMessage();
        hapticFeedback('success');
        clearSession();
      } finally {
        decidingRef.current = false;
      }
    },
    [
      decidingRef,
      dismissMessage,
      pauseInstanceId,
      selectedMood,
      selectedMoodAfter,
      context,
      ritualEntry,
      breathingFirstCompleted,
      breathingSecondCompleted,
      feelIntensity,
      shiftIntensity,
      reflectionMessage,
      haiku,
      refreshSubscription,
      user?.id,
      t,
      setDecision,
      setPauseImpactData,
      setPhase,
    ],
  );

  return { handleDecide };
}
