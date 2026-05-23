import { describe, expect, it } from 'vitest';
import { pickPauseHolzenProvidersSlice } from './pause-holzen-providers-slice';

describe('pickPauseHolzenProvidersSlice', () => {
  it('maps Holzen context fields into the pause provider slice', () => {
    const dismissMessage = async () => {};
    const resyncOpenPauseFromDb = () => {};

    expect(
      pickPauseHolzenProvidersSlice({
        mantra: null,
        dismissMessage,
        message: 'Take a breath.',
        context: 'btc_move',
        companions: { haiku: 'line' },
        lastPauseInstanceId: 'inst-1',
        companionPrefs: {
          breathing: true,
          haiku: true,
          grounding: false,
          signal: false,
          zoomOut: false,
          history: false,
        },
        severity: 'moderate',
        profileLoaded: true,
        resyncOpenPauseFromDb,
        btcData: null,
        trackedAssetId: 'bitcoin',
      }),
    ).toEqual({
      mantra: '',
      dismissMessage,
      message: 'Take a breath.',
      context: 'btc_move',
      companions: { haiku: 'line' },
      lastPauseInstanceId: 'inst-1',
      companionPrefs: {
        breathing: true,
        haiku: true,
        grounding: false,
        signal: false,
        zoomOut: false,
        history: false,
      },
      severity: 'moderate',
      profileLoaded: true,
      resyncOpenPauseFromDb,
      btcData: null,
      trackedAssetId: 'bitcoin',
    });
  });
});
