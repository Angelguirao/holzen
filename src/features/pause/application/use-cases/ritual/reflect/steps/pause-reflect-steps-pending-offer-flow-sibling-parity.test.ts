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
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as pendingOfferFlow from '../pending-offer/pause-reflect-pending-offer-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

describe('pause-reflect-steps-flow ↔ pause-reflect-pending-offer-flow sibling parity', () => {
  it('steps-flow and pending-offer-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');

    expect('runAdoptPendingPauseOffer' in stepsFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in stepsFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in stepsFlow).toBe(false);
    expect('trackPausePendingAdopted' in stepsFlow).toBe(false);
    expect('trackPausePendingDeclined' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in pendingOfferFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in pendingOfferFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in pendingOfferFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in pendingOfferFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in pendingOfferFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in pendingOfferFlow).toBe(false);
  });

  it('steps umbrella exports stay off pending-offer adopt/decline and display', () => {
    expect(runPauseFavoriteToggle).not.toBe(runAdoptPendingPauseOffer);
    expect(runPauseReflectNoteUpdate).not.toBe(runDeclinePendingPauseOffer);
    expect(runPauseReflectTagUpdate).not.toBe(runAdoptPendingPauseOffer);
    expect(runPauseReflectionStepLogOnce).not.toBe(runDeclinePendingPauseOffer);
    expect(shouldShowFavoriteProHint).not.toBe(getPendingPauseOfferDisplay);
    expect(shouldLogPauseReflectionStep).not.toBe(trackPausePendingAdopted);
    expect(shouldLogPauseReflectionStep).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer umbrella exports stay off reflect step mutations and step gates', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runPauseFavoriteToggle);
    expect(runDeclinePendingPauseOffer).not.toBe(runPauseReflectNoteUpdate);
    expect(getPendingPauseOfferDisplay).not.toBe(runPauseReflectTagUpdate);
    expect(trackPausePendingAdopted).not.toBe(runPauseReflectionStepLogOnce);
    expect(trackPausePendingDeclined).not.toBe(shouldShowFavoriteProHint);
    expect(trackPauseSessionAbandoned).not.toBe(shouldLogPauseReflectionStep);
  });
});
