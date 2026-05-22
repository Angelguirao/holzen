/**
 * Reflect mood beat presentation I/O (feel tiles, depth picker, chrome close, initial emotion RPC).
 * Imports domain mood leaf modules and `run-initial-emotion-log` directly (parity with
 * `pause-reflect-hub-io` → domain + leaf use case).
 * Wrapper delegation pins: pause-reflect-mood-io-parity.test.ts (default + *WithRepository seams).
 * Sibling surface pins: `pause-reflect-steps-mood-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io`,
 * `pause-reflect-generation-mood-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`,
 * `pause-reflect-mood-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`;
 * `pause-reflect-mood-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io`.
 */
import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  type InitialEmotionUiState,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
} from '@/features/pause/domain/reflect/mood/pause-session-chrome-close';
import { runDeepPausePickerEntryIfPro } from '@/features/pause/domain/reflect/mood/run-deep-pause-picker-entry-if-pro';
import { resolvePauseDepthContextLineParams } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
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

/** Test seam: inject a custom `PauseRepository` for mood select. */
export function pauseInitialEmotionSelectWithRepository(
  repository: PauseRepository,
  input: Parameters<typeof runInitialEmotionSelect>[1],
): ReturnType<typeof runInitialEmotionSelect> {
  return runInitialEmotionSelect(repository, input);
}

/** Test seam: inject a custom `PauseRepository` for mood skip. */
export function pauseInitialEmotionSkipWithRepository(
  repository: PauseRepository,
  input: Parameters<typeof runInitialEmotionSkip>[1],
): ReturnType<typeof runInitialEmotionSkip> {
  return runInitialEmotionSkip(repository, input);
}
