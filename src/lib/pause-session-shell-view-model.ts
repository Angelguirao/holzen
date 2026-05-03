import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { PauseSessionHydrationReady } from '@/lib/pause-session-hydration';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/lib/pause-session-storage';

/** Session fields `PauseSession` reads after `usePauseSessionShell` + `computePauseSessionResolved`. */
export type PauseSessionShellViewModel = {
  message: string;
  context: string | null;
  pauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
};

/**
 * Default shell fields when hydration is not yet `ready` (no `resolved` row).
 * Severity falls back to live Holzen severity; other fields use storage defaults.
 */
export function coalescePauseSessionShellViewModel(
  resolved: PauseSessionHydrationReady | null,
  holzenSeverity: 'mild' | 'moderate' | 'high',
): PauseSessionShellViewModel {
  return {
    message: resolved?.message ?? '',
    context: resolved?.context ?? null,
    pauseInstanceId: resolved?.pauseInstanceId ?? null,
    companions: resolved?.companions ?? DEFAULT_COMPANIONS,
    companionPrefs: resolved?.companionPrefs ?? DEFAULT_PREFS,
    severity: resolved?.severity ?? holzenSeverity,
  };
}
