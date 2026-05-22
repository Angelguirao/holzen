import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

import {
  deliverReflectionShareImage as deliverReflectionShareImageDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/share/deliver-reflection-share-image';
import {
  deliverReflectionShareImage,
  runReflectionShareImage as runReflectionShareImageFromOrchestration,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow';
import { runReflectionShareImage as runReflectionShareImageDirect } from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import * as shareFlow from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import * as orchestrationFlow from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryIo,
  trackPauseReflectShareTap as trackShareTapFromTelemetryIo,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import * as shareIo from './pause-reflect-share-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromShareIo,
  buildReflectionShareText as buildTextFromShareIo,
  buildReflectionShareTweetUrl as buildTweetFromShareIo,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromShareIo,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';

/**
 * Presentation-layer share I/O parity (colocated beside `pause-reflect-share-io.ts`).
 * Generation-io sibling: `pause-reflect-generation-share-io-sibling-parity.test.ts`.
 * Flows-io sibling: `pause-reflect-flows-share-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (colocated under `presentation/reflect/flows/`).
 * Telemetry-io sibling: `pause-reflect-share-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-share-io parity', () => {
  it('presentation I/O share builder exports match share CI umbrella', () => {
    expect(buildReflectionShareText).toBe(buildTextFromShareIo);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetFromShareIo);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramFromShareIo);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppFromShareIo);
  });

  it('share CI umbrella composes the same run-reflection-share-image leaf as presentation I/O', () => {
    expect(runReflectionShareImage).toBe(runReflectionShareImageDirect);
  });

  it('share-flow and orchestration-flow re-export the same runReflectionShareImage leaf as presentation I/O', () => {
    expect(runReflectionShareImage).toBe(runReflectionShareImageFromOrchestration);
    expect(runReflectionShareImageFromOrchestration).toBe(runReflectionShareImageDirect);
    expect(typeof pauseReflectionShareImage).toBe('function');
  });

  it('share orchestration CI umbrella composes deliver + run leaf modules', () => {
    expect(deliverReflectionShareImage).toBe(deliverReflectionShareImageDirect);
    expect(runReflectionShareImageFromOrchestration).toBe(runReflectionShareImageDirect);
  });

  it('share CI umbrella session UI telemetry matches presentation telemetry I/O', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryIo);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryIo);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryIo);
  });

  it('presentation share-io stays off deliver-reflection-share-image (orchestration-flow sibling parity)', () => {
    expect('deliverReflectionShareImage' in shareIo).toBe(false);
    expect('runReflectionShareImage' in shareIo).toBe(false);
    expect('trackPauseReflectPostItOpen' in shareIo).toBe(false);
    expect('trackPauseReflectShareTap' in shareIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in shareIo).toBe(false);
    expect(pauseReflectionShareImage).not.toBe(deliverReflectionShareImage);
    expect(pauseReflectionShareImage).not.toBe(deliverReflectionShareImageDirect);
    expect(pauseReflectionShareImage).not.toBe(runReflectionShareImageFromOrchestration);
    expect(typeof pauseReflectionShareImage).toBe('function');
  });

  it('share-flow vs orchestration-flow CI namespaces stay separated (presentation share-io off both)', () => {
    expect('deliverReflectionShareImage' in shareFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in shareFlow).toBe(true);
    expect('deliverReflectionShareImage' in orchestrationFlow).toBe(true);
    expect('trackPauseReflectPostItOpen' in orchestrationFlow).toBe(false);
    expect(runReflectionShareImage).toBe(runReflectionShareImageFromOrchestration);
    expect(runReflectionShareImage).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectPostItOpen).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectWallpaperTap).not.toBe(runReflectionShareImageFromOrchestration);
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-flows-share-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from share-io wrappers', () => {
    expect(pauseReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildTextFromShareIo).not.toBe(pauseReflectOutcomeLog);
    expect(buildTelegramFromShareIo).not.toBe(formatReinforcementQuoteFromSession);
    expect(buildTweetFromShareIo).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(buildWhatsAppFromShareIo).not.toBe(buildPauseScoreImpacts);
    expect(pauseReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(buildTextFromShareIo).not.toBe(pauseReflectOutcomeLogWithRepository);
    // Full pins: `pause-reflect-flows-share-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-generation-share-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io exports stay distinct from share-io wrappers', () => {
    expect(pauseReflectionShareImage).not.toBe(runReflectGeneration);
    expect(buildTextFromShareIo).not.toBe(pauseReflectGeneration);
    expect(buildTelegramFromShareIo).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildTweetFromShareIo).not.toBe(reflectGenerationPrerequisite);
    expect(buildWhatsAppFromShareIo).not.toBe(messageFromReflectGenerationResult);
    expect(pauseReflectionShareImage).not.toBe(reflectGenerator);
    expect(buildTextFromShareIo).not.toBe(shouldCommitReflectGeneration);
    // Full pins: `pause-reflect-generation-share-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: telemetry-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(trackPostItFromTelemetryIo);
    expect(buildTextFromShareIo).not.toBe(trackShareTapFromTelemetryIo);
    expect(buildTelegramFromShareIo).not.toBe(trackWallpaperFromTelemetryIo);
    expect(buildTweetFromShareIo).not.toBe(trackPostItFromTelemetryIo);
    expect(buildWhatsAppFromShareIo).not.toBe(trackShareTapFromTelemetryIo);
    expect(pauseReflectionShareImage).not.toBe(trackWallpaperFromTelemetryIo);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseAdoptPendingOffer);
    expect(buildTextFromShareIo).not.toBe(pauseDeclinePendingOffer);
    expect(buildTelegramFromShareIo).not.toBe(getPendingPauseOfferDisplay);
    expect(buildTweetFromShareIo).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(buildWhatsAppFromShareIo).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseReflectionShareImage).not.toBe(reflectPauseRepository);
    // Full pins: `pause-reflect-share-pending-offer-io-sibling-parity.test.ts`.
  });
});
