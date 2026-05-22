/**
 * Reflect mood beat presentation I/O (feel tiles, depth picker, chrome close, initial emotion RPC).
 * Imports mood subcluster flow anchors directly (parity with
 * `pause-reflect-hub-io` → hub subcluster flows).
 */
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  isPauseSessionDepthPickerActive,
  resolvePauseDepthContextLineParams,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-depth-picker-mood-flow';
import { buildFeelTilesMoodLogOptions } from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-feel-tiles-mood-flow';
import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  type InitialEmotionUiState,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-presentation-flow';
import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-initial-emotion-log-flow';
import {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-session-mood-chrome-flow';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  isPauseSessionDepthPickerActive,
  resolvePauseDepthContextLineParams,
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
  type InitialEmotionUiState,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
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
