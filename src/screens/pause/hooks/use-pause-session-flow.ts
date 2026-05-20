import {
  usePauseSessionFlowCore,
  usePauseSessionRitualSurface,
} from '@/features/pause/public-hooks';
import { usePauseSessionScaffoldVm } from '@/screens/pause/hooks/use-pause-session-scaffold-vm';
import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;

/**
 * `/pause` shell hydrate, ritual state, step handlers, and scaffold props (after providers).
 * Chrome slots stay in screens; merge logic lives in presentation.
 */
export function usePauseSessionFlow(p: PauseSessionProviders) {
  const { step } = usePauseSessionFlowCore(p);
  const scaffoldVm = usePauseSessionScaffoldVm(p, step);
  return usePauseSessionRitualSurface({ prefersReducedMotion: p.prefersReducedMotion }, step, scaffoldVm);
}
