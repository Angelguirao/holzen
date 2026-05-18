import { useMemo } from 'react';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import { usePauseSessionFetch } from '@/hooks/use-pause-session-fetch';
import {
  computePauseSessionHydration,
  computePauseSessionResolved,
  type PauseSessionHydrationReady,
  type PauseSessionHydrationState,
} from '@/features/pause/application/session/hydration';
import { hasPersistedPauseSessionPayload } from '@/features/pause/application/session/persisted-session-guards';
import type { PauseSessionNavParsed } from '@/lib/router-location-state';
import { type FetchedPauseInstance, type PersistedSession } from '@/features/pause/domain/session-model';
import { loadSession } from '@/features/pause/public';

export type PauseSessionShellHolzen = {
  message: string | null;
  context: string | null;
  lastPauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
};

/**
 * Restore + hydration + optional id-fetch + resolved shell for `/pause`.
 * Keeps the same memo / fetch dependency behavior as the prior inline `PauseSession` block.
 *
 * **Contract:** `docs/systems/pause-system.md` section 7.2 (hydration); pure helpers in
 * `src/lib/pause-session-hydration.ts`. **Code map:** same doc, section 10.
 */
export function usePauseSessionShell(params: {
  locationKey: string;
  nav: PauseSessionNavParsed;
  holzen: PauseSessionShellHolzen;
}): {
  restored: PersistedSession | null;
  hydration: PauseSessionHydrationState;
  fetchPauseInstanceId: string | null;
  fetchedInstance: FetchedPauseInstance | null;
  fetchFailed: boolean;
  resolved: PauseSessionHydrationReady | null;
} {
  const { locationKey, nav, holzen } = params;

  const restored = useMemo(() => {
    const saved = loadSession();
    if (!hasPersistedPauseSessionPayload(saved)) return null;
    if (nav.pauseInstanceId && saved.pauseInstanceId && saved.pauseInstanceId !== nav.pauseInstanceId) {
      return null;
    }
    return saved;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on location.key + nav pause id; loadSession is a stable module import
  }, [locationKey, nav.pauseInstanceId]);

  const holzenAligned =
    !nav.pauseInstanceId ||
    (holzen.lastPauseInstanceId != null && holzen.lastPauseInstanceId === nav.pauseInstanceId);

  const hydration = useMemo((): PauseSessionHydrationState => {
    return computePauseSessionHydration({
      restored,
      navPauseInstanceId: nav.pauseInstanceId,
      navReflectionMessage: nav.reflectionMessage,
      navContext: nav.context,
      navCompanions: nav.companions,
      navCompanionPrefs: nav.companionPrefs,
      navSeverity: nav.severity,
      holzenMessage: holzen.message,
      holzenContext: holzen.context,
      holzenLastPauseInstanceId: holzen.lastPauseInstanceId,
      holzenCompanions: holzen.companions,
      holzenCompanionPrefs: holzen.companionPrefs,
      holzenSeverity: holzen.severity,
      holzenAligned,
    });
  }, [
    restored,
    holzen.message,
    holzen.context,
    holzen.lastPauseInstanceId,
    holzen.companions,
    holzen.companionPrefs,
    holzen.severity,
    holzenAligned,
    nav.pauseInstanceId,
    nav.reflectionMessage,
    nav.context,
    nav.companions,
    nav.companionPrefs,
    nav.severity,
  ]);

  const fetchPauseInstanceId = hydration.status === 'fetch' ? hydration.pauseInstanceId : null;
  const { fetchedInstance, fetchFailed } = usePauseSessionFetch(fetchPauseInstanceId);

  const resolved: PauseSessionHydrationReady | null = useMemo(
    () =>
      computePauseSessionResolved({
        hydration,
        fetchedInstance,
        navCompanionPrefs: nav.companionPrefs,
        holzenCompanionPrefs: holzen.companionPrefs,
        navSeverity: nav.severity,
        holzenSeverity: holzen.severity,
      }),
    [hydration, fetchedInstance, nav.companionPrefs, nav.severity, holzen.companionPrefs, holzen.severity],
  );

  return {
    restored,
    hydration,
    fetchPauseInstanceId,
    fetchedInstance,
    fetchFailed,
    resolved,
  };
}
