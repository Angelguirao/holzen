import { buildPauseSessionStepRitualBundle, buildPauseSessionStepShellBundle } from '@/screens/pause/hooks/pause-session-step-bundles';
import {
  usePauseSessionBreathReflectHandlers,
  usePauseSessionMoodChromeHandlers,
} from '@/features/pause/public-hooks';
import type { usePauseSessionProviders } from '@/screens/pause/hooks/use-pause-session-providers';
import type { usePauseSessionShellRitual } from '@/screens/pause/hooks/use-pause-session-shell-ritual';

type PauseSessionProviders = ReturnType<typeof usePauseSessionProviders>;
type PauseSessionShellRitual = ReturnType<typeof usePauseSessionShellRitual>;

/** Mood, breath, reflect/decide, and chrome handlers (inputs for scaffold assembly). */
export function usePauseSessionStepHandlers(
  p: PauseSessionProviders,
  shellRitual: PauseSessionShellRitual,
) {
  const { subscribed, handleReturn } = p;
  const { mood, toggleFavorite, handlePauseSessionChromeClose } = usePauseSessionMoodChromeHandlers(
    p,
    shellRitual,
  );
  const { breath, reflect, handleFrameImDone } = usePauseSessionBreathReflectHandlers(
    p,
    shellRitual,
    mood,
  );

  return {
    shell: buildPauseSessionStepShellBundle(shellRitual.shell, { handleReturn }),
    ritual: buildPauseSessionStepRitualBundle(shellRitual.ritual),
    mood,
    breath,
    reflect,
    toggleFavorite,
    handlePauseSessionChromeClose,
    handleFrameImDone,
    subscribed,
  };
}
