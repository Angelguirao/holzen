import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';
import { usePauseSessionRitualHandlers } from '@/screens/pause/hooks/use-pause-session-ritual-handlers';
import { usePauseSessionShellRitual } from '@/features/pause/public-hooks';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;

/**
 * `/pause` shell hydrate, ritual state, step handlers, and scaffold props (after providers).
 */
export function usePauseSessionFlow(p: PauseSessionProviders) {
  const shellRitual = usePauseSessionShellRitual(p);
  return usePauseSessionRitualHandlers(p, shellRitual);
}
