import { describe, expect, it } from 'vitest';
import {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
} from './pause-session-providers-io';

describe('pause-session-providers-io', () => {
  it('re-exports pickPauseHolzenProvidersSlice from pause-holzen-providers-slice', () => {
    const slice: PauseHolzenProvidersSlice = pickPauseHolzenProvidersSlice({
      mantra: null,
      dismissMessage: async () => {},
      message: 'Take a breath.',
      context: 'btc_move',
      companions: { haiku: 'line', groundingTitle: null, groundingBody: null },
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
      resyncOpenPauseFromDb: () => {},
      btcData: null,
      trackedAssetId: 'bitcoin',
    });

    expect(slice.mantra).toBe('');
    expect(slice.message).toBe('Take a breath.');
  });
});
