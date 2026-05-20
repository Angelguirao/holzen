import { useHolzen } from '@/screens/home/hooks/use-holzen';
import {
  usePauseSessionProviders as usePauseSessionProvidersPresentation,
  type PauseSessionProviders,
} from '@/features/pause/public-hooks';

export type { PauseSessionProviders };

/** Screen conductor: Holzen context + presentation pause session providers. */
export function usePauseSessionProviders(): PauseSessionProviders {
  const holzen = useHolzen();

  return usePauseSessionProvidersPresentation({
    mantra: holzen.mantra,
    dismissMessage: holzen.dismissMessage,
    message: holzen.message,
    context: holzen.context,
    companions: holzen.companions,
    lastPauseInstanceId: holzen.lastPauseInstanceId,
    companionPrefs: holzen.companionPrefs,
    severity: holzen.severity,
    profileLoaded: holzen.profileLoaded,
    resyncOpenPauseFromDb: holzen.resyncOpenPauseFromDb,
    btcData: holzen.btcData,
    trackedAssetId: holzen.trackedAssetId,
  });
}
