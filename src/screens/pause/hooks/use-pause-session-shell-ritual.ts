import {
  usePauseSessionRitualState,
  usePauseSessionShellBootstrap,
  usePauseSessionTerminalEntryRedirect,
} from '@/features/pause/public-hooks';
import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;

/** Shell hydrate/fetch, coalesced session, and ritual UI state for `/pause`. */
export function usePauseSessionShellRitual(p: PauseSessionProviders) {
  const { t, navigate, handleClose, holzenForShell, resyncOpenPauseFromDb } = p;

  const shell = usePauseSessionShellBootstrap({
    holzen: holzenForShell,
    navigate,
    resyncOpenPauseFromDb,
    handleClose,
    t,
  });

  const ritual = usePauseSessionRitualState(shell.restored);

  usePauseSessionTerminalEntryRedirect({
    pauseInstanceId: shell.pauseInstanceIdForTerminal,
    shellReady:
      shell.resolved != null ||
      (shell.hydration.status === 'fetch' &&
        !shell.waitingForFetch &&
        shell.fetchedInstance != null &&
        shell.pauseInstanceIdForTerminal != null),
    waitingForFetch: shell.waitingForFetch,
    fetchFailed: shell.fetchFailed,
    fetchPauseInstanceId: shell.fetchPauseInstanceId,
    fetchedInstance: shell.fetchedInstance,
    restored: shell.restored,
    pauseSessionPhase: ritual.phase,
  });

  return { shell, ritual };
}
