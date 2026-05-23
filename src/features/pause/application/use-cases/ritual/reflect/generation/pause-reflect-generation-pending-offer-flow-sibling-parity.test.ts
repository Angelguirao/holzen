import { describe, expect, it } from 'vitest';

import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '../pending-offer/pause-reflect-pending-offer-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
} from './pause-reflect-generation-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as pendingOfferFlow from '../pending-offer/pause-reflect-pending-offer-flow';

describe('pause-reflect-generation-flow ↔ pause-reflect-pending-offer-flow sibling parity', () => {
  it('generation-flow and pending-offer-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');

    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('runAdoptPendingPauseOffer' in generationFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in generationFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in generationFlow).toBe(false);
    expect('trackPausePendingAdopted' in generationFlow).toBe(false);
    expect('trackPausePendingDeclined' in generationFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in generationFlow).toBe(false);
    expect('runReflectGeneration' in pendingOfferFlow).toBe(false);
    expect('openManualPauseFromHome' in pendingOfferFlow).toBe(false);
    expect('dismissOpenPauseHome' in pendingOfferFlow).toBe(false);
    expect('resolveReflectGenerationPrefetch' in pendingOfferFlow).toBe(false);
  });

  it('generation umbrella exports stay off pending-offer adopt/decline, display, and telemetry', () => {
    expect(runReflectGeneration).not.toBe(runAdoptPendingPauseOffer);
    expect(resolveReflectGenerationPrefetch).not.toBe(runDeclinePendingPauseOffer);
    expect(openManualPauseFromHome).not.toBe(getPendingPauseOfferDisplay);
    expect(dismissOpenPauseHome).not.toBe(trackPausePendingAdopted);
    expect(runReflectGeneration).not.toBe(trackPausePendingDeclined);
    expect(openManualPauseFromHome).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer umbrella exports stay off holzen-reflect generation and manual-open leaf use cases', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runReflectGeneration);
    expect(runDeclinePendingPauseOffer).not.toBe(runReflectGeneration);
    expect(getPendingPauseOfferDisplay).not.toBe(resolveReflectGenerationPrefetch);
    expect(trackPausePendingAdopted).not.toBe(openManualPauseFromHome);
    expect(trackPausePendingDeclined).not.toBe(dismissOpenPauseHome);
    expect(trackPauseSessionAbandoned).not.toBe(runReflectGeneration);
  });
});
