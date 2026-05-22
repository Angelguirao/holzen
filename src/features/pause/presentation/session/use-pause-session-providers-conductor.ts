import { useHolzen } from '@/app/components/HolzenProvider';
import { pickPauseHolzenProvidersSlice } from './pause-session-providers-io';
import { usePauseSessionProvidersFromHolzenSlice } from './use-pause-session-providers';
import type { PauseSessionProviders } from './pause-session-providers-types';

/** `/pause` route — Holzen context + presentation provider bag. */
export function usePauseSessionProviders(): PauseSessionProviders {
  const holzen = useHolzen();
  return usePauseSessionProvidersFromHolzenSlice(pickPauseHolzenProvidersSlice(holzen));
}
