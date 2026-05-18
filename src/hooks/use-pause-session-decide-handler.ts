import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { MoodValue } from '@/components/MoodCheck';
import type { RitualDepth } from '@/lib/pause-session-storage';
import { clearSession } from '@/lib/pause-session-storage';
import { hapticFeedback } from '@/lib/haptics';
import { useAuth } from '@/hooks/use-auth';
import { pauseLogStep } from '@/features/pause/public-rpc';
import { buildOutcomeLoggedPayload } from '@/lib/pause-outcome-log-payload';
import { showPauseOutcomeNotCompletedToast, showPauseOutcomeSaveFailedToast } from '@/lib/pause-outcome-toast';
import type { PauseState } from '@/features/pause/domain/pause-state';
import { buildPauseImpactDataOnComplete, type PauseImpactData } from '@/lib/pause-impact-data';
import { invalidatePauseStatsDataForUser } from '@/lib/pause-stats-invalidate';
import { getSessionQuote } from '@/lib/wisdom-quotes';

export function usePauseSessionDecideHandler(input: {
  decidingRef: MutableRefObject<boolean>;
  pauseInstanceId: string | null;
  t: TFunction;
  refreshSubscription: () => void | Promise<void>;
  setDecision: Dispatch<SetStateAction<string | null>>;
  dismissMessage: () => void | Promise<void>;
  setPauseImpactData: Dispatch<SetStateAction<PauseImpactData | null>>;
  setPhase: Dispatch<SetStateAction<'session' | 'done'>>;
  context: string | null;
  selectedMood: MoodValue | null;
  selectedMoodAfter: MoodValue | null;
  ritualEntry: RitualDepth | 'picker';
  breathingFirstCompleted: boolean;
  breathingSecondCompleted: boolean;
  feelIntensity: number | null;
  shiftIntensity: number | null;
  reflectionMessage: string;
  haiku: string | null;
}): { handleDecide: (d: string) => Promise<void> } {
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
        let outcomeState: PauseState | null = null;
        if (pauseInstanceId) {
          try {
            outcomeState = await pauseLogStep({
              instanceId: pauseInstanceId,
              stepType: 'outcome_logged',
              payload: buildOutcomeLoggedPayload(d),
            });
          } catch {
            showPauseOutcomeSaveFailedToast(t);
            return;
          }
          if (outcomeState !== 'completed') {
            invalidatePauseStatsDataForUser(user?.id);
            showPauseOutcomeNotCompletedToast(t);
            void refreshSubscription();
            return;
          }
          void refreshSubscription();
        }
        setDecision(d);
        const q = getSessionQuote();
        setPauseImpactData(
          buildPauseImpactDataOnComplete({
            decision: d,
            context,
            selectedMood,
            selectedMoodAfter,
            ritualEntry,
            breathingFirstCompleted,
            breathingSecondCompleted,
            feelIntensity,
            shiftIntensity,
            reinforcementQuote: `"${q.text}" — ${q.author}`,
            reflectionMessage,
            haiku,
          }),
        );
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
