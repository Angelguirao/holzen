import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log';
import {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
};

/** Default `PauseRepository` for reflect mood presentation hooks. */
export const reflectPauseRepository = supabasePauseRepository;

/** Default port + use case: feel-step mood select (`initial_emotion_logged`, deduped). */
export function pauseInitialEmotionSelect(
  input: Parameters<typeof runInitialEmotionSelect>[1],
): ReturnType<typeof runInitialEmotionSelect> {
  return runInitialEmotionSelect(reflectPauseRepository, input);
}

/** Default port + use case: feel-step mood skip (`initial_emotion_logged` skipped payload). */
export function pauseInitialEmotionSkip(
  input: Parameters<typeof runInitialEmotionSkip>[1],
): ReturnType<typeof runInitialEmotionSkip> {
  return runInitialEmotionSkip(reflectPauseRepository, input);
}
