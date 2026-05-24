import { useProfile } from '@/features/user/public-hooks';
import { usePauseHomeContext } from '../home/pause-home-context';
import {
  buildPauseHolzenProvidersPickSource,
  pickPauseHolzenProvidersSlice,
} from './pause-session-providers-io';
import { usePauseSessionProvidersFromHolzenSlice } from './use-pause-session-providers';
import type { PauseSessionProviders } from './pause-session-providers-types';

/** `/pause` route — pause home context + profile + presentation provider bag. */
export function usePauseSessionProviders(): PauseSessionProviders {
  const pause = usePauseHomeContext();
  const { mantra, companionPrefs, profileLoaded, trackedAssetId } = useProfile();
  return usePauseSessionProvidersFromHolzenSlice(
    pickPauseHolzenProvidersSlice(
      buildPauseHolzenProvidersPickSource(pause, {
        mantra,
        companionPrefs,
        profileLoaded,
        trackedAssetId,
      }),
    ),
  );
}
