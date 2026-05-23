import type { PauseSessionBreathReflectProvidersSlice } from './breath/pause-session-breath-reflect-handler-types';
import type { PauseSessionMoodChromeProvidersSlice } from '../feel/pause-session-mood-chrome-handler-types';

export type {
  PauseSessionBreathReflectMoodSlice,
  PauseSessionBreathReflectProvidersSlice,
  PauseSessionBreathReflectRitualSlice,
  PauseSessionBreathReflectShellSlice,
} from './breath/pause-session-breath-reflect-handler-types';

export type {
  PauseSessionMoodChromeProvidersSlice,
  PauseSessionMoodChromeRitualSlice,
  PauseSessionMoodChromeShellSlice,
} from '../feel/pause-session-mood-chrome-handler-types';

/** Provider fields for mood + breath/reflect step handlers (subset of `usePauseSessionProviders`). */
export type PauseSessionStepHandlersProvidersSlice = PauseSessionMoodChromeProvidersSlice &
  PauseSessionBreathReflectProvidersSlice;
