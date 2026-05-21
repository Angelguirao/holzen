import { useHolzen } from '@/app/components/HolzenProvider';
import { pickPauseHolzenProvidersSlice } from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
import { usePauseSessionProvidersFromHolzenSlice } from './use-pause-session-providers';
import type { PauseSessionProviders } from './pause-session-providers-types';

/** `/pause` route — Holzen context + presentation provider bag. */
export function usePauseSessionProviders(): PauseSessionProviders {
  const holzen = useHolzen();
  return usePauseSessionProvidersFromHolzenSlice(pickPauseHolzenProvidersSlice(holzen));
}
