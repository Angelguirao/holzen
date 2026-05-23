import { describe, expect, it } from 'vitest';

import {
  buildFeelTilesMoodLogOptions,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './pause-feel-flow';
import * as moodFlow from './pause-feel-flow';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '../reflect/pending-offer/pause-reflect-pending-offer-flow';
import * as pendingOfferFlow from '../reflect/pending-offer/pause-reflect-pending-offer-flow';

/**
 * Application sibling parity: mood-flow vs pending-offer-flow CI anchors.
 */
describe('pause-feel-flow ↔ pause-reflect-pending-offer-flow sibling parity', () => {
  it('mood-flow and pending-offer-flow are distinct sibling CI anchors', () => {
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');

    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('runAdoptPendingPauseOffer' in moodFlow).toBe(false);
    expect('runDeclinePendingPauseOffer' in moodFlow).toBe(false);
    expect('getPendingPauseOfferDisplay' in moodFlow).toBe(false);
    expect('trackPausePendingAdopted' in moodFlow).toBe(false);
    expect('trackPausePendingDeclined' in moodFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in moodFlow).toBe(false);

    expect('runInitialEmotionSelect' in pendingOfferFlow).toBe(false);
    expect('runInitialEmotionSkip' in pendingOfferFlow).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in pendingOfferFlow).toBe(false);
  });

  it('mood-flow exports stay off pending-offer adopt/decline, display, and telemetry', () => {
    expect(runInitialEmotionSelect).not.toBe(runAdoptPendingPauseOffer);
    expect(runInitialEmotionSkip).not.toBe(runDeclinePendingPauseOffer);
    expect(buildFeelTilesMoodLogOptions).not.toBe(getPendingPauseOfferDisplay);
    expect(runInitialEmotionSelect).not.toBe(trackPausePendingAdopted);
    expect(runInitialEmotionSkip).not.toBe(trackPausePendingDeclined);
    expect(buildFeelTilesMoodLogOptions).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer-flow exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(runInitialEmotionSelect);
    expect(runDeclinePendingPauseOffer).not.toBe(runInitialEmotionSkip);
    expect(getPendingPauseOfferDisplay).not.toBe(buildFeelTilesMoodLogOptions);
    expect(trackPausePendingAdopted).not.toBe(runInitialEmotionSelect);
    expect(trackPausePendingDeclined).not.toBe(runInitialEmotionSkip);
    expect(trackPauseSessionAbandoned).not.toBe(buildFeelTilesMoodLogOptions);
  });
});
