/**
 * `/pause` route orchestration — Holzen + chrome in screens; flow/VM in presentation.
 * Screen map: docs/screens/pause.md · Product model: docs/systems/pause-system.md
 */
import {
  usePauseSessionProviders,
  usePauseSessionScreenViewModel,
} from '@/features/pause/public-hooks';
import { usePauseSessionFlow } from '@/screens/pause/hooks/use-pause-session-flow';

export function usePauseSessionScreen() {
  const providers = usePauseSessionProviders();
  const ritual = usePauseSessionFlow(providers);
  return usePauseSessionScreenViewModel(providers, ritual);
}
