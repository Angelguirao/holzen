/**
 * Home manual-open reflect cluster I/O (use cases, domain builders, dismiss preview, default ports).
 * Colocated under `presentation/reflect/generation/manual-open/` (parity with application `generation/manual-open/` cluster).
 * Imports manual-open use cases and domain builders from sibling modules directly
 * (parity with `pause-home-reflect-telemetry-io` → leaf telemetry modules, not manual-open-flow umbrella).
 * Parity pins: `pause-home-reflect-io.test.ts`, `pause-home-reflect-io.re-exports.test.ts`,
 * `pause-home-reflect-io-parity.test.ts` (colocated in this folder).
 * Sibling parity: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`;
 * reciprocal inline pins: `pause-home-reflect-io.test.ts` ↔ `pause-reflect-generation-io.test.ts`;
 * `pause-home-reflect-telemetry-home-reflect-io-sibling-parity.test.ts` ↔ `pause-home-reflect-telemetry-io`;
 * `pause-home-reflect-io-parity.test.ts` (colocated) ↔ `pause-reflect-generation-manual-open-flow`.
 */
import { dismissOpenPauseHome } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home';
import { openManualPauseFromHome } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/open-manual-pause-from-home';
import { runOpenManualPauseSilentModeAfterCreate } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-open-manual-pause-silent-mode-after-create';
import { runPersistSilentReflectionStub } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub';
import {
  buildManualPauseCreateOrReuseParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  type ManualPauseCreateOrReuseParams,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-create-or-reuse-params';
import {
  buildManualPauseMarketContext,
  type ManualPauseMarketContext,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-market-context';
import {
  buildManualPauseOpenParams,
  type BuildManualPauseOpenParamsInput,
} from '@/features/pause/domain/reflect/generation/build-manual-pause-open-params';
import type {
  TrackManualPauseInstanceCreatedPayload,
  TrackPauseManualCompletedPayload,
} from '@/features/pause/domain/reflect/generation/manual-pause-home-telemetry-types';
import type {
  OpenManualPauseFromHomeParams,
  OpenManualPauseFromHomePorts,
  OpenManualPauseFromHomeResult,
} from '@/features/pause/domain/reflect/generation/open-manual-pause-from-home-types';
import type {
  PersistSilentReflectionStubInput,
  PersistSilentReflectionStubResult,
} from '@/features/pause/domain/reflect/generation/persist-silent-reflection-stub-types';
import type {
  RunOpenManualPauseSilentModeAfterCreateError,
  RunOpenManualPauseSilentModeAfterCreateInput,
  RunOpenManualPauseSilentModeAfterCreateOpened,
  RunOpenManualPauseSilentModeAfterCreateResult,
} from '@/features/pause/domain/reflect/generation/open-manual-pause-silent-mode-after-create-types';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  supabasePauseRepository,
  supabaseReflectGenerator,
} from '@/features/pause/public-rpc';

export {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
  type BuildManualPauseOpenParamsInput,
  type ManualPauseCreateOrReuseParams,
  type ManualPauseMarketContext,
  type OpenManualPauseFromHomeParams,
  type OpenManualPauseFromHomePorts,
  type OpenManualPauseFromHomeResult,
  type PersistSilentReflectionStubInput,
  type PersistSilentReflectionStubResult,
  type RunOpenManualPauseSilentModeAfterCreateError,
  type RunOpenManualPauseSilentModeAfterCreateInput,
  type RunOpenManualPauseSilentModeAfterCreateOpened,
  type RunOpenManualPauseSilentModeAfterCreateResult,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
};
export {
  applyManualPauseOpenResult,
  type ApplyManualPauseOpenResultInput,
  type ManualPauseHomePreviewPorts,
} from './apply-manual-pause-open-result';

/** Default ports for `openManualPauseFromHome` (Home manual trigger). */
export const pauseHomeManualOpenPorts = {
  repository: supabasePauseRepository,
  reflect: supabaseReflectGenerator,
} as const;

/** Default facade: clear Home preview and dismiss current pause instance. */
export async function pauseDismissOpenPauseHomePreview(ports: {
  hasUser: boolean;
  clearPreview: () => void;
}): Promise<void> {
  return dismissOpenPauseHome(ports.hasUser, {
    clearPreview: ports.clearPreview,
    repository: pauseHomeManualOpenPorts.repository,
  });
}

/** Test seam: inject a custom `PauseRepository` for Home dismiss. */
export function pauseDismissOpenPauseHomePreviewWithRepository(
  repository: PauseRepository,
  ports: { hasUser: boolean; clearPreview: () => void },
): ReturnType<typeof dismissOpenPauseHome> {
  return dismissOpenPauseHome(ports.hasUser, {
    clearPreview: ports.clearPreview,
    repository,
  });
}
