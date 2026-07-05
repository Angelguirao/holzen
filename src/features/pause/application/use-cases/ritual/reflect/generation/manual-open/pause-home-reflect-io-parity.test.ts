/**
 * Application-layer I/O parity for Home manual-open reflect cluster (parity with
 * `pause-home-reflect-telemetry-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-home-reflect-io.ts`).
 * Imports `pause-reflect-generation-manual-open-flow` CI umbrella for `.toBe` identity pins only —
 * production home reflect I/O keeps manual-open leaf imports.
 * Presentation mirror: `presentation/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
 * Sibling parity: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` and
 * `telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 * Share-io sibling pins: reciprocal inline pins ↔ `share/pause-reflect-share-io-parity.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

const dismissOpenPauseHomeMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'pauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home',
  () => ({
    dismissOpenPauseHome: dismissOpenPauseHomeMock,
  }),
);

import { dismissOpenPauseHome as dismissDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home';
import { openManualPauseFromHome as openDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/open-manual-pause-from-home';
import { runOpenManualPauseSilentModeAfterCreate as silentAfterCreateDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-open-manual-pause-silent-mode-after-create';
import { runPersistSilentReflectionStub as persistStubDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub';
import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityFromManualOpenFlow,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow';
import { applyManualPauseOpenResult as applyOpenResultDirect } from '@/features/pause/presentation/reflect/generation/manual-open/apply-manual-pause-open-result';
import * as homeReflectIo from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import {
  applyManualPauseOpenResult,
  applyManualPauseOpenResult as applyOpenResultFromHomeIo,
  buildManualPauseCreateOrReuseParams as buildCreateOrReuseFromHomeIo,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  buildManualPauseMarketContext as buildMarketFromHomeIo,
  buildManualPauseOpenParams as buildOpenParamsFromHomeIo,
  dismissOpenPauseHome as dismissFromHomeIo,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityFromHomeIo,
  openManualPauseFromHome as openFromHomeIo,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate as silentAfterCreateFromHomeIo,
  runPersistSilentReflectionStub as persistStubFromHomeIo,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io';
import * as homeReflectTelemetryIo from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import * as pendingOfferTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
import {
  buildReflectionShareText,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

import { supabasePauseRepository, supabaseReflectGenerator } from '@/features/pause/public-rpc';

describe('pause-home-reflect-io parity (application)', () => {
  it('presentation I/O manual-open exports match manual-open-flow CI umbrella', () => {
    expect(openManualPauseFromHome).toBe(openFromHomeIo);
    expect(dismissOpenPauseHome).toBe(dismissFromHomeIo);
    expect(runPersistSilentReflectionStub).toBe(persistStubFromHomeIo);
    expect(runOpenManualPauseSilentModeAfterCreate).toBe(silentAfterCreateFromHomeIo);
    expect(buildManualPauseMarketContext).toBe(buildMarketFromHomeIo);
    expect(buildManualPauseOpenParams).toBe(buildOpenParamsFromHomeIo);
    expect(buildManualPauseCreateOrReuseParams).toBe(buildCreateOrReuseFromHomeIo);
    expect(MANUAL_PAUSE_VOLATILITY_TEMPLATE).toBe(volatilityFromHomeIo);
    expect(MANUAL_PAUSE_VOLATILITY_TEMPLATE).toBe(volatilityFromManualOpenFlow);
    expect(applyManualPauseOpenResult).toBe(applyOpenResultFromHomeIo);
    expect(applyManualPauseOpenResult).toBe(applyOpenResultDirect);
  });

  it('manual-open-flow CI umbrella composes the same run-* leaf use cases as presentation I/O', () => {
    expect(openManualPauseFromHome).toBe(openDirect);
    expect(dismissOpenPauseHome).toBe(dismissDirect);
    expect(runPersistSilentReflectionStub).toBe(persistStubDirect);
    expect(runOpenManualPauseSilentModeAfterCreate).toBe(silentAfterCreateDirect);
    expect(openFromHomeIo).toBe(openDirect);
    expect(dismissFromHomeIo).toBe(dismissDirect);
    expect(persistStubFromHomeIo).toBe(persistStubDirect);
    expect(silentAfterCreateFromHomeIo).toBe(silentAfterCreateDirect);
  });

  it('presentation I/O binds pauseHomeManualOpenPorts to public-rpc adapters', () => {
    expect(pauseHomeManualOpenPorts.repository).toBe(supabasePauseRepository);
    expect(pauseHomeManualOpenPorts.reflect).toBe(supabaseReflectGenerator);
  });

  it('presentation home-reflect-io exports preview dismiss wrappers distinct from leaf dismiss', () => {
    expect(typeof pauseDismissOpenPauseHomePreview).toBe('function');
    expect(typeof pauseDismissOpenPauseHomePreviewWithRepository).toBe('function');
    expect(pauseDismissOpenPauseHomePreview).not.toBe(dismissDirect);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(dismissFromHomeIo);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(dismissDirect);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(pauseDismissOpenPauseHomePreviewWithRepository);
  });

  it('pauseDismissOpenPauseHomePreview delegates to dismissOpenPauseHome with default repository', async () => {
    const clearPreview = vi.fn();
    await pauseDismissOpenPauseHomePreview({ hasUser: true, clearPreview });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(true, {
      clearPreview,
      repository: supabasePauseRepository,
    });
  });

  it('pauseDismissOpenPauseHomePreviewWithRepository forwards injected PauseRepository', async () => {
    const clearPreview = vi.fn();
    const customRepo = { port: 'injected-dismiss' } as unknown as typeof supabasePauseRepository;

    await pauseDismissOpenPauseHomePreviewWithRepository(customRepo, {
      hasUser: false,
      clearPreview,
    });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(false, {
      clearPreview,
      repository: customRepo,
    });
  });

  it('home-reflect-io dismiss wrappers stay distinct from manual-open-flow leaf exports', () => {
    expect(pauseDismissOpenPauseHomePreview).not.toBe(dismissOpenPauseHome);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(dismissOpenPauseHome);
    // Reciprocal inline pins: `presentation/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
  });

  it('presentation home-reflect-io stays off home-reflect-telemetry-io exports', () => {
    expect('trackPauseOpenDismissed' in homeReflectIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in homeReflectIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in homeReflectIo).toBe(false);
    expect('trackPauseManualCompleted' in homeReflectIo).toBe(false);
    expect('openManualPauseFromHome' in homeReflectTelemetryIo).toBe(false);
    expect('pauseDismissOpenPauseHomePreview' in homeReflectTelemetryIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in homeReflectTelemetryIo).toBe(false);
  });

  it('presentation home-reflect-io stays off pending-offer-io RPC wrappers', () => {
    expect('pauseAdoptPendingOffer' in homeReflectIo).toBe(false);
    expect('pauseDeclinePendingOffer' in homeReflectIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in homeReflectIo).toBe(false);
    expect('openManualPauseFromHome' in pendingOfferIo).toBe(false);
    expect('pauseDismissOpenPauseHomePreview' in pendingOfferIo).toBe(false);
  });

  /**
   * Reciprocal inline pins ↔ `pause-home-reflect-telemetry-io-parity.test.ts` (application).
   * Dedicated sibling: `pause-home-reflect-telemetry-home-reflect-io-sibling-parity.test.ts` (presentation).
   */
  it('sibling cluster: home-reflect-telemetry-io exports stay distinct from home-reflect-io', () => {
    expect(openFromHomeIo).not.toBe(trackPauseOpenDismissed);
    expect(dismissFromHomeIo).not.toBe(trackPauseOpenDismissed);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(markPauseManualStartedHomeOnce);
    expect(pauseHomeManualOpenPorts).not.toBe(trackManualPauseInstanceCreated);
    expect(buildMarketFromHomeIo).not.toBe(trackPauseManualCompleted);
    expect(openFromHomeIo).not.toBe(trackManualPauseInstanceCreated);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(trackPauseOpenDismissed);
    // Reciprocal inline pins: `pause-home-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (application + presentation).
   * Dedicated sibling: `pause-reflect-generation-pending-offer-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: pending-offer-io exports stay distinct from home-reflect-io', () => {
    expect(openFromHomeIo).not.toBe(pauseAdoptPendingOffer);
    expect(dismissFromHomeIo).not.toBe(pauseDeclinePendingOffer);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseHomeManualOpenPorts).not.toBe(getPendingPauseOfferDisplay);
    expect(buildOpenParamsFromHomeIo).not.toBe(pauseAdoptPendingOffer);
    expect(buildCreateOrReuseFromHomeIo).not.toBe(pauseDeclinePendingOffer);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts`.
  });

  it('home-reflect-io manual-open wrappers stay distinct from pending-offer-telemetry-io trackers', () => {
    expect(openFromHomeIo).not.toBe(trackPausePendingAdopted);
    expect(dismissFromHomeIo).not.toBe(trackPausePendingDeclined);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(trackPauseSessionAbandoned);
    expect('trackPausePendingAdopted' in homeReflectIo).toBe(false);
    expect('openManualPauseFromHome' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseDismissOpenPauseHomePreview' in pendingOfferTelemetryIo).toBe(false);
  });

  /**
   * Reciprocal inline pins ↔ `telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling: `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from home-reflect-io', () => {
    expect(openFromHomeIo).not.toBe(trackPauseReflectPostItOpen);
    expect(dismissFromHomeIo).not.toBe(trackPauseReflectShareTap);
    expect(pauseHomeManualOpenPorts).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(trackPauseReflectPostItOpen);
    expect(buildMarketFromHomeIo).not.toBe(trackPauseReflectShareTap);
    expect(persistStubFromHomeIo).not.toBe(trackPauseReflectWallpaperTap);
    expect(openManualPauseFromHome).not.toBe(trackPauseReflectPostItOpen);
    expect('trackPauseReflectPostItOpen' in homeReflectIo).toBe(false);
    expect('trackPauseReflectShareTap' in homeReflectIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in homeReflectIo).toBe(false);
    // Reciprocal inline pins: `application/.../telemetry/pause-reflect-telemetry-io-parity.test.ts`,
    // `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`,
    // `presentation/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io exports stay distinct from home-reflect-io', () => {
    expect(openFromHomeIo).not.toBe(runReflectGeneration);
    expect(dismissFromHomeIo).not.toBe(pauseReflectGeneration);
    expect(buildMarketFromHomeIo).not.toBe(reflectGenerationPrerequisite);
    expect(buildOpenParamsFromHomeIo).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildCreateOrReuseFromHomeIo).not.toBe(messageFromReflectGenerationResult);
    expect(pauseHomeManualOpenPorts).not.toBe(reflectGenerator);
    expect(persistStubFromHomeIo).not.toBe(shouldCommitReflectGeneration);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(pauseReflectGeneration);
    expect(pauseHomeManualOpenPorts.reflect).toBe(reflectGenerator);
    // Reciprocal inline pins: `application/.../generation/pause-reflect-generation-io-parity.test.ts`,
    // `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
  });

  it('application home-reflect-io parity anchor stays off generation-io holzen-reflect wrappers', () => {
    expect('openManualPauseFromHome' in generationIo).toBe(false);
    expect('pauseDismissOpenPauseHomePreview' in generationIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in generationIo).toBe(false);
    expect('runReflectGeneration' in homeReflectIo).toBe(false);
    expect('pauseReflectGeneration' in homeReflectIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in homeReflectIo).toBe(true);
    expect('reflectGenerator' in generationIo).toBe(true);
  });

  /**
   * Reciprocal inline pins ↔ `share/pause-reflect-share-io-parity.test.ts`
   * (Home manual-open I/O vs reflection share builders).
   */
  it('sibling cluster: share-io builders stay distinct from home-reflect-io', () => {
    expect(openFromHomeIo).not.toBe(pauseReflectionShareImage);
    expect(dismissFromHomeIo).not.toBe(buildReflectionShareText);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(pauseReflectionShareImage);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(buildReflectionShareText);
    expect(pauseHomeManualOpenPorts).not.toBe(pauseReflectionShareImage);
    expect(buildMarketFromHomeIo).not.toBe(buildReflectionShareText);
    expect(persistStubFromHomeIo).not.toBe(pauseReflectionShareImage);
    // Reciprocal inline pins: `share/pause-reflect-share-io-parity.test.ts`,
    // `presentation/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
  });
});
