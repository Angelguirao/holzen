import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'reflectGenerator' },
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import { pauseReflectionShareImage } from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  pauseReflectGeneration,
  runReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';

describe('pause-reflect-ambience-io', () => {
  it('re-exports domain frame-focus ambience helpers for presentation conductors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');
  });

  it('sibling cluster: ambience-io exports stay distinct from generation-io holzen-reflect surface', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseReflectGeneration);
    // Full cross-I/O pins: `pause-reflect-ambience-generation-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: flows-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseReflectOutcomeLog);
    // Full cross-I/O pins: `pause-reflect-flows-ambience-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: share-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectionShareImage);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseReflectionShareImage);
    // Full cross-I/O pins: `pause-reflect-share-ambience-io-sibling-parity.test.ts` and
    // `pause-reflect-ambience-share-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: pending-offer-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseAdoptPendingOffer);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseDeclinePendingOffer);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(getPendingPauseOfferDisplay);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(reflectPauseRepository);
    // Full cross-I/O pins: reciprocal inline pins on `pause-reflect-pending-offer-io.test.ts`;
    // frame-focus bed vs pending-offer RPC: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts`.
  });
});
