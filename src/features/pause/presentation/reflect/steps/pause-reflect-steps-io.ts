/**
 * Reflect step mutation presentation I/O (bound PauseRepository + step storage).
 * Imports domain step gates and `run-pause-*` use cases directly (parity with
 * `pause-reflect-hub-io` → domain + leaf use case).
 * Wrapper delegation pins: `pause-reflect-steps-io.test.ts` (default + *WithRepository seams incl. reflection_step log);
 * `pause-reflect-steps-io-parity.test.ts` (flow umbrella + application layer).
 * Sibling surfaces: `pause-reflect-flows-steps-io-sibling-parity.test.ts`,
 * `pause-reflect-steps-flows-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io` (reciprocal inline pins in
 * `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-flows-io.test.ts`);
 * `pause-reflect-steps-mood-io-sibling-parity.test.ts` ↔ `pause-reflect-mood-io` (presentation + application);
 * reciprocal inline pins: `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-mood-io.test.ts`;
 * application parity: `pause-reflect-steps-io-parity.test.ts` ↔ `pause-reflect-mood-io-parity.test.ts`;
 * `pause-reflect-steps-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`;
 * reciprocal inline pins: `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-hub-io.test.ts`;
 * application parity: `pause-reflect-steps-io-parity.test.ts` ↔ `pause-reflect-hub-io-parity.test.ts`;
 * `pause-reflect-share-steps-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`;
 * reciprocal inline pins: `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-share-io.test.ts`,
 * `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-generation-io.test.ts`,
 * `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-pending-offer-io.test.ts`,
 * `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-io`;
 * `pause-reflect-steps-generation-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`;
 * `pause-reflect-steps-ambience-io-sibling-parity.test.ts` ↔ `pause-reflect-ambience-io` (presentation + application);
 * reciprocal inline pins: `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-ambience-io.test.ts`;
 * application parity: `pause-reflect-steps-io-parity.test.ts` ↔ `pause-reflect-ambience-io-parity.test.ts`;
 * `pause-reflect-steps-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-telemetry-io` (presentation + application);
 * reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts` ↔ `pause-reflect-telemetry-io-parity.test.ts`;
 * `pause-reflect-steps-flow-io-wrapper-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow` (application CI umbrella),
 * `pause-reflect-steps-note-tag-io-sibling-parity.test.ts` (note vs tag wrappers on this module;
 * reciprocal inline pins: `pause-reflect-steps-io.test.ts` ↔ `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`;
 * application: `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`,
 * `pause-reflect-note-flow.test.ts` ↔ `pause-reflect-tag-flow.test.ts`, and
 * `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts` ↔ `pause-reflect-steps-flow`).
 * `pause-reflect-steps-favorite-reflection-step-log-io-sibling-parity.test.ts` (favorite vs reflection_step log wrappers;
 * application: `pause-reflect-steps-favorite-reflection-step-log-io-sibling-parity.test.ts`,
 * `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts`, and
 * `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`).
 * `pause-session-step-handlers-steps-io-sibling-parity.test.ts` ↔ `pause-session-step-handlers-io` (session bundle builders;
 * application mirror: `application/.../session/pause-session-step-handlers-steps-io-sibling-parity.test.ts`;
 * reciprocal inline pins: `pause-reflect-steps-io.test.ts` ↔ `pause-session-step-handlers-io.test.ts`).
 * Application flow umbrellas: `pause-reflect-steps-flow.test.ts` ↔ `pause-reflect-generation-flow.test.ts` (reciprocal inline).
 * Cross-surface application: `pause-session-step-handlers-steps-flow-sibling-parity.test.ts` ↔ `pause-session-step-handlers-flow`.
 */
import { runPauseFavoriteToggle } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update';
import { runPauseReflectTagUpdate } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
import { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';
import { shouldLogPauseReflectionStep } from '@/features/pause/domain/reflect/steps/reflection-step-log';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import type { ReflectionStepLogStoragePort } from '@/features/pause/ports/reflection-step-log-storage';
import {
  reflectionStepSessionStorage,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';

export { shouldLogPauseReflectionStep, shouldShowFavoriteProHint };
export { showPauseFavoriteProHintToast } from './pause-favorite-pro-hint-toast';

/** Default `PauseRepository` for reflect steps presentation hooks. */
export const reflectPauseRepository = supabasePauseRepository;

/** Default port + use case: reflect post-it tags commit. */
export function pauseReflectTagUpdate(
  input: { pauseInstanceId: string; tags: string[] },
): ReturnType<typeof runPauseReflectTagUpdate> {
  return runPauseReflectTagUpdate(reflectPauseRepository, input);
}

/** Default port + use case: reflect post-it note commit. */
export function pauseReflectNoteUpdate(
  input: { pauseInstanceId: string; text: string },
): ReturnType<typeof runPauseReflectNoteUpdate> {
  return runPauseReflectNoteUpdate(reflectPauseRepository, input);
}

/** Default port + use case: reflect heart favorite toggle. */
export function pauseReflectFavoriteToggle(
  input: { pauseInstanceId: string | null; isFavorite: boolean },
): ReturnType<typeof runPauseFavoriteToggle> {
  return runPauseFavoriteToggle(reflectPauseRepository, input);
}

/** Default port + storage: once-per-tab `reflection_step` log. */
export function pauseReflectionStepLogOnce(
  input: { pauseInstanceId: string },
): ReturnType<typeof runPauseReflectionStepLogOnce> {
  return runPauseReflectionStepLogOnce(reflectPauseRepository, input, {
    storage: reflectionStepSessionStorage,
  });
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseReflectTagUpdateWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string; tags: string[] },
): ReturnType<typeof runPauseReflectTagUpdate> {
  return runPauseReflectTagUpdate(repository, input);
}

export function pauseReflectNoteUpdateWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string; text: string },
): ReturnType<typeof runPauseReflectNoteUpdate> {
  return runPauseReflectNoteUpdate(repository, input);
}

export function pauseReflectFavoriteToggleWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; isFavorite: boolean },
): ReturnType<typeof runPauseFavoriteToggle> {
  return runPauseFavoriteToggle(repository, input);
}

/** Test seam: inject custom `PauseRepository` and optional step-log storage port. */
export function pauseReflectionStepLogOnceWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string },
  ports: { storage: ReflectionStepLogStoragePort } = {
    storage: reflectionStepSessionStorage,
  },
): ReturnType<typeof runPauseReflectionStepLogOnce> {
  return runPauseReflectionStepLogOnce(repository, input, ports);
}
