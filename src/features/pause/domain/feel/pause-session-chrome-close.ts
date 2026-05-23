export type PauseSessionPhase = 'session' | 'done';

export type PauseSessionChromeCloseAction = 'return' | 'request_exit';

/** Ritual header close: done shell navigates home; in-session opens leave/pending flow. */
export function resolvePauseSessionChromeCloseAction(
  phase: PauseSessionPhase,
): PauseSessionChromeCloseAction {
  return phase === 'done' ? 'return' : 'request_exit';
}

export function runPauseSessionChromeCloseAction(
  action: PauseSessionChromeCloseAction,
  handlers: { onReturn: () => void; onRequestExit: () => void },
): void {
  if (action === 'return') {
    handlers.onReturn();
    return;
  }
  handlers.onRequestExit();
}
