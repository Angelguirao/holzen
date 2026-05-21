import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/application/use-cases/session/step-bundles';
import type { PauseSessionShellRitualResult } from './use-pause-session-shell-ritual';
import type { PauseSessionStepHandlersProvidersSlice } from './pause-session-step-handler-types';
import { usePauseSessionBreathReflectHandlers } from '../reflect/flows/use-pause-session-breath-reflect-handlers';
import { usePauseSessionMoodChromeHandlers } from '../reflect/mood/use-pause-session-mood-chrome-handlers';

/** Mood, breath, reflect/decide, and chrome handlers (inputs for scaffold assembly). */
export function usePauseSessionStepHandlers(
  p: PauseSessionStepHandlersProvidersSlice,
  shellRitual: PauseSessionShellRitualResult,
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

export type PauseSessionStepHandlersResult = ReturnType<typeof usePauseSessionStepHandlers>;
