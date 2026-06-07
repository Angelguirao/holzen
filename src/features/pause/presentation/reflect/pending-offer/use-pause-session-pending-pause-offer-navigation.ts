import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';

export type PendingAdoptNavigationTarget = {
  instanceId: string;
  context?: string | null;
};

/** After adopt: land on depth picker for the promoted instance (Figma C′ → `/pause`). */
export function buildPauseSessionNavStateAfterPendingAdopt(
  target: PendingAdoptNavigationTarget,
): {
  pauseInstanceId: string;
  context: string | null;
  reflectionMessage: string;
  startAtDepthPicker: true;
} {
  return {
    pauseInstanceId: target.instanceId,
    context: target.context ?? null,
    reflectionMessage: '',
    startAtDepthPicker: true,
  };
}

/** After adopt on Home or `/pause`: resync Holzen + navigate to depth picker on the new instance. */
export function usePauseSessionPendingPauseOfferNavigation(input: {
  navigate: NavigateFunction;
  resyncOpenPauseFromDb: () => void | Promise<void>;
}): {
  onAfterMutation: () => Promise<void>;
  navigateAfterAdopt: (target: PendingAdoptNavigationTarget) => void;
} {
  const { navigate, resyncOpenPauseFromDb } = input;

  const onAfterMutation = useCallback(async () => {
    await resyncOpenPauseFromDb();
  }, [resyncOpenPauseFromDb]);

  const navigateAfterAdopt = useCallback(
    (target: PendingAdoptNavigationTarget) => {
      clearPausePersistedTabSession();
      navigate('/pause', {
        state: buildPauseSessionNavStateAfterPendingAdopt(target),
        replace: true,
      });
    },
    [navigate],
  );

  return { onAfterMutation, navigateAfterAdopt };
}
