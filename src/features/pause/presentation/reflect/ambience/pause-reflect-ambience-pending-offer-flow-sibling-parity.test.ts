import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import * as ambienceFlow from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import * as pendingOfferFlow from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';

/**
 * Presentation mirror of application flow sibling parity (CI anchors only — production I/O
 * uses `pause-reflect-ambience-io` / `pause-reflect-pending-offer-io` leaf bindings).
 * Application source: `application/.../ambience/pause-reflect-ambience-pending-offer-flow-sibling-parity.test.ts`.
 * I/O sibling: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-ambience-flow ↔ pause-reflect-pending-offer-flow sibling parity (presentation)', () => {
  it('ambience-flow and pending-offer-flow are distinct sibling CI anchors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('runAdoptPendingPauseOffer' in ambienceFlow).toBe(false);
    expect('runDeclinePendingOffer' in ambienceFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in ambienceFlow).toBe(false);
    expect('trackPausePendingAdopted' in ambienceFlow).toBe(false);
    expect('trackPausePendingDeclined' in ambienceFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in ambienceFlow).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in pendingOfferFlow).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in pendingOfferFlow).toBe(false);
  });

  it('ambience-flow exports stay off pending-offer adopt/decline, display, and telemetry', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runAdoptPendingPauseOffer);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runDeclinePendingPauseOffer);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(getPendingPauseOfferDisplay);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(trackPausePendingAdopted);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(trackPausePendingDeclined);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer-flow exports stay off frame-focus ambience bed helpers', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runDeclinePendingPauseOffer).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(getPendingPauseOfferDisplay).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPausePendingAdopted).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPausePendingDeclined).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseSessionAbandoned).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
