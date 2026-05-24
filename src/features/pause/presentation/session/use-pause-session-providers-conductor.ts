import { usePauseHomeContext } from '../home/pause-home-context';
import { pickPauseHolzenProvidersSlice } from './pause-session-providers-io';
import { usePauseSessionProvidersFromHolzenSlice } from './use-pause-session-providers';
import type { PauseSessionProviders } from './pause-session-providers-types';

/** `/pause` route — pause home context + presentation provider bag. */
export function usePauseSessionProviders(): PauseSessionProviders {
  const holzen = usePauseHomeContext();
  return usePauseSessionProvidersFromHolzenSlice(pickPauseHolzenProvidersSlice(holzen));
}
