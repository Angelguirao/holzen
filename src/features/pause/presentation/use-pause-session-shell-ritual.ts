import type { NavigateFunction } from 'react-router-dom';
import type { TFunction } from 'i18next';
import type { PauseSessionShellHolzen } from '@/features/pause/public';
import { usePauseSessionRitualState } from './use-pause-session-ritual-state';
import { usePauseSessionShellBootstrap } from './use-pause-session-shell-bootstrap';
import { usePauseSessionTerminalEntryRedirect } from './use-pause-session-terminal-entry-redirect';

/** Subset of `usePauseSessionProviders` for shell + ritual bootstrap. */
export type PauseSessionShellRitualProvidersSlice = {
  t: TFunction;
  navigate: NavigateFunction;
  handleClose: () => void;
  holzenForShell: PauseSessionShellHolzen;
  resyncOpenPauseFromDb: () => void | Promise<void>;
};

export type PauseSessionShellRitualResult = {
  shell: ReturnType<typeof usePauseSessionShellBootstrap>;
  ritual: ReturnType<typeof usePauseSessionRitualState>;
};

/** Shell hydrate/fetch, coalesced session, and ritual UI state for `/pause`. */
export function usePauseSessionShellRitual(
  p: PauseSessionShellRitualProvidersSlice,
): PauseSessionShellRitualResult {
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
