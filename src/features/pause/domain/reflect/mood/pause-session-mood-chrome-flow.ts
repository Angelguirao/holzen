import type { RitualDepth } from '@/features/pause/domain/ritual-types';

export function isBriefRitualEntry(ritualEntry: RitualDepth | 'picker'): ritualEntry is 'brief' {
  return ritualEntry === 'brief';
}

/** Pro gate for depth picker → deep ritual; returns whether deep entry ran. */
export function runDeepPausePickerEntryIfPro(
  requirePro: (feature: 'deep_pause') => boolean,
  onDeep: () => void,
): boolean {
  if (!requirePro('deep_pause')) return false;
  onDeep();
  return true;
}

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
