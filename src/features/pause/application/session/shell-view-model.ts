import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { PauseSessionHydrationReady } from '@/features/pause/application/session/hydration';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/domain/session-model';

/**
 * Normalizes `PauseSessionHydrationReady | null` into the shell fields the `/pause` route reads
 * (message, instance id, companions, prefs, severity). When `resolved` is null, severity falls back
 * to live Holzen; other fields use storage defaults.
 *
 * **Call site:** `src/pages/PauseSession.tsx` after `usePauseSessionShell`.
 * **Hydration:** `docs/systems/pause-system.md` section 7.2; **code map:** same doc, section 10.
 */

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
