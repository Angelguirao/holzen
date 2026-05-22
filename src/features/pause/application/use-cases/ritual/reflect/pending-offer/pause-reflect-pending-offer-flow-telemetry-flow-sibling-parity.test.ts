import { describe, expect, it } from 'vitest';

import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-flow';
import * as pendingOfferFlow from './pause-reflect-pending-offer-flow';
import {
  trackPausePendingAdopted as trackAdoptedFromTelemetryFlow,
  trackPausePendingDeclined as trackDeclinedFromTelemetryFlow,
  trackPauseSessionAbandoned as trackAbandonedFromTelemetryFlow,
} from '../telemetry/pause-pending-offer-telemetry-flow';
import * as pendingOfferTelemetryFlow from '../telemetry/pause-pending-offer-telemetry-flow';

/**
 * Application sibling parity: presentation umbrella vs PostHog-only subcluster anchor.
 */
describe('pause-reflect-pending-offer-flow ↔ pause-pending-offer-telemetry-flow sibling parity', () => {
  it('pending-offer-flow and pending-offer-telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('runAdoptPendingPauseOffer' in pendingOfferFlow).toBe(true);
    expect('runDeclinePendingPauseOffer' in pendingOfferFlow).toBe(true);
    expect('getPendingPauseOfferDisplay' in pendingOfferFlow).toBe(true);
    expect('trackPausePendingAdopted' in pendingOfferFlow).toBe(true);
    expect('trackPausePendingDeclined' in pendingOfferFlow).toBe(true);
    expect('trackPauseSessionAbandoned' in pendingOfferFlow).toBe(true);

    expect('trackPausePendingAdopted' in pendingOfferTelemetryFlow).toBe(true);
    expect('trackPausePendingDeclined' in pendingOfferTelemetryFlow).toBe(true);
    expect('trackPauseSessionAbandoned' in pendingOfferTelemetryFlow).toBe(true);
    expect('runAdoptPendingPauseOffer' in pendingOfferTelemetryFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in pendingOfferTelemetryFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in pendingOfferTelemetryFlow).toBe(false);
  });

  it('pending-offer-flow shares PostHog tracker bindings with telemetry-flow subcluster', () => {
    expect(trackPausePendingAdopted).toBe(trackAdoptedFromTelemetryFlow);
    expect(trackPausePendingDeclined).toBe(trackDeclinedFromTelemetryFlow);
    expect(trackPauseSessionAbandoned).toBe(trackAbandonedFromTelemetryFlow);
    expect(trackPausePendingAdopted).not.toBe(trackDeclinedFromTelemetryFlow);
    expect(trackPausePendingDeclined).not.toBe(trackAbandonedFromTelemetryFlow);
  });

  it('pending-offer-flow umbrella re-exports RPC + display, not telemetry-flow-only surface', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(trackAdoptedFromTelemetryFlow);
    expect(runDeclinePendingPauseOffer).not.toBe(trackDeclinedFromTelemetryFlow);
    expect(getPendingPauseOfferDisplay).not.toBe(trackAbandonedFromTelemetryFlow);
    expect(getPendingPauseOfferDisplay).not.toBe(trackAdoptedFromTelemetryFlow);
  });

  it('telemetry-flow subcluster stays off adopt/decline RPC and display projection', () => {
    expect(trackAdoptedFromTelemetryFlow).not.toBe(runAdoptPendingPauseOffer);
    expect(trackDeclinedFromTelemetryFlow).not.toBe(runDeclinePendingPauseOffer);
    expect(trackAbandonedFromTelemetryFlow).not.toBe(getPendingPauseOfferDisplay);
    expect(trackAdoptedFromTelemetryFlow).not.toBe(getPendingPauseOfferDisplay);
    expect(trackDeclinedFromTelemetryFlow).not.toBe(getPendingPauseOfferDisplay);
  });
});
