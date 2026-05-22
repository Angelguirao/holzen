import { describe, expect, it } from 'vitest';

import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '../pending-offer/pause-reflect-pending-offer-flow';
import {
  buildPauseScoreImpacts,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
} from './pause-reflect-flows-flow';
import * as flowsFlow from './pause-reflect-flows-flow';
import * as pendingOfferFlow from '../pending-offer/pause-reflect-pending-offer-flow';

describe('pause-reflect-flows-flow ↔ pause-reflect-pending-offer-flow sibling parity', () => {
  it('flows-flow and pending-offer-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');

    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');

    expect('runAdoptPendingPauseOffer' in flowsFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in flowsFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in flowsFlow).toBe(false);
    expect('trackPausePendingAdopted' in flowsFlow).toBe(false);
    expect('trackPausePendingDeclined' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in pendingOfferFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in pendingOfferFlow).toBe(false);
    expect('runPauseOutcomeLog' in pendingOfferFlow).toBe(false);
    expect('buildPauseScoreImpacts' in pendingOfferFlow).toBe(false);
  });

  it('flows umbrella exports stay off pending-offer adopt/decline, display, and telemetry', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runAdoptPendingPauseOffer);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(runDeclinePendingPauseOffer);
    expect(runPauseOutcomeLog).not.toBe(getPendingPauseOfferDisplay);
    expect(buildPauseScoreImpacts).not.toBe(trackPausePendingAdopted);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(trackPausePendingDeclined);
  });

  it('pending-offer umbrella exports stay off reflect+decide flow helpers', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runDeclinePendingPauseOffer).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(getPendingPauseOfferDisplay).not.toBe(runPauseOutcomeLog);
    expect(trackPausePendingAdopted).not.toBe(buildPauseScoreImpacts);
    expect(trackPausePendingDeclined).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
  });
});
