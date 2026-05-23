/**
 * Reflect mood beat presentation I/O (feel tiles, depth picker, chrome close, initial emotion RPC).
 * Imports domain mood leaf modules and `run-initial-emotion-log` directly (parity with
 * `pause-reflect-hub-io` → domain + leaf use case).
 * Wrapper delegation pins: pause-feel-io-parity.test.ts (default + *WithRepository seams;
 * flows-io + hub-io reciprocal inline pins).
 * Sibling surface pins: `pause-reflect-steps-feel-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io`
 * (presentation + application `pause-reflect-steps-feel-io-sibling-parity.test.ts`);
 * reciprocal inline pins: `pause-feel-io.test.ts` ↔ `pause-reflect-steps-io.test.ts`;
 * presentation parity (colocated): `presentation/feel/pause-feel-io-parity.test.ts` ↔ `pause-reflect-steps-io-parity.test.ts` (application)
 * and `pause-reflect-ambience-io-parity.test.ts` (reciprocal inline pins);
 * `pause-reflect-generation-feel-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io` (presentation + application),
 * `pause-feel-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io` (application mirrors:
 * `application/.../mood/pause-feel-hub-io-sibling-parity.test.ts` and
 * `application/.../hub/pause-reflect-hub-feel-io-sibling-parity.test.ts`; hub-anchored presentation:
 * `hub/pause-reflect-hub-feel-io-sibling-parity.test.ts`);
 * `pause-feel-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io` (application mirror:
 * `application/.../mood/pause-feel-pending-offer-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-feel-io-parity.test.ts` ↔ `pause-reflect-pending-offer-io-parity.test.ts`);
 * `pause-reflect-flows-feel-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io` (application
 * `pause-reflect-flows-feel-io-sibling-parity.test.ts` under `application/.../flows/`; reciprocal inline pins in
 * colocated `pause-reflect-flows-io-parity.test.ts` ↔ `pause-feel-io-parity.test.ts`),
 * `pause-feel-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io`, and
 * `pause-reflect-ambience-feel-io-sibling-parity.test.ts` ↔ `pause-reflect-ambience-io` (application mirror:
 * `application/.../ambience/pause-reflect-ambience-feel-io-sibling-parity.test.ts`; reciprocal inline:
 * `pause-feel-io-parity.test.ts` ↔ `pause-reflect-ambience-io-parity.test.ts`);
 * `pause-reflect-share-feel-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`.
 * Reciprocal inline pins: `pause-feel-io.test.ts` ↔ `pause-reflect-flows-io.test.ts` and
 * `pause-reflect-telemetry-io.test.ts`.
 * `pause-feel-flow-io-wrapper-sibling-parity.test.ts` beside this module (mood-flow CI umbrella vs
 * `pauseInitialEmotionSelect*` / `reflectPauseRepository`; application mirror under `application/.../mood/`),
 * parity with steps/flows/share/generation/pending-offer flow↔io wrapper mirrors.
 */
import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/feel/run-initial-emotion-log';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/feel/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/feel/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  type InitialEmotionUiState,
} from '@/features/pause/domain/feel/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive } from '@/features/pause/domain/feel/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction,
  runPauseSessionChromeCloseAction,
  type PauseSessionChromeCloseAction,
  type PauseSessionPhase,
} from '@/features/pause/domain/feel/pause-session-chrome-close';
import { runDeepPausePickerEntryIfPro } from '@/features/pause/domain/feel/run-deep-pause-picker-entry-if-pro';
import { resolvePauseDepthContextLineParams } from '@/features/pause/domain/feel/resolve-pause-depth-context-line-params';
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
