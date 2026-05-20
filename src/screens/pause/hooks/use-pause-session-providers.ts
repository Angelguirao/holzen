import { useHolzen } from '@/app/components/HolzenProvider';
import { pickPauseHolzenProvidersSlice } from '@/features/pause/public';
import {
  usePauseSessionProviders as usePauseSessionProvidersPresentation,
  type PauseSessionProviders,
} from '@/features/pause/public-hooks';

export type { PauseSessionProviders };

/** Screen conductor: Holzen context + presentation pause session providers. */
export function usePauseSessionProviders(): PauseSessionProviders {
  const holzen = useHolzen();
  return usePauseSessionProvidersPresentation(pickPauseHolzenProvidersSlice(holzen));
}
