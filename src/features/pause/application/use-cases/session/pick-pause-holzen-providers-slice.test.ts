import { describe, expect, it } from 'vitest';
import {
  buildPauseHolzenProvidersPickSource,
  pickPauseHolzenProvidersSlice,
} from './pause-holzen-providers-slice';

describe('pickPauseHolzenProvidersSlice', () => {
  it('maps Holzen context fields into the pause provider slice', () => {
    const dismissMessage = async () => {};
    const dismissOpenPauseFromWidget = () => {};
    const resyncOpenPauseFromDb = () => {};

    expect(
      pickPauseHolzenProvidersSlice({
        dismissMessage,
        dismissOpenPauseFromWidget,
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
        marketData: null,
        trackedAssetId: 'bitcoin',
      }),
    ).toEqual({
      dismissMessage,
      dismissOpenPauseFromWidget,
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
      marketData: null,
      trackedAssetId: 'bitcoin',
    });
  });

  it('buildPauseHolzenProvidersPickSource merges pause home + profile', () => {
    const dismissMessage = async () => {};
    const dismissOpenPauseFromWidget = () => {};
    const resyncOpenPauseFromDb = () => {};
    const pause = {
      dismissMessage,
      dismissOpenPauseFromWidget,
      message: 'Hi',
      context: null,
      companions: { haiku: null },
      lastPauseInstanceId: null,
      severity: 'mild' as const,
      marketData: null,
      resyncOpenPauseFromDb,
    };
    const picked = pickPauseHolzenProvidersSlice(
      buildPauseHolzenProvidersPickSource(pause, {
        companionPrefs: {
          breathing: true,
          haiku: true,
          grounding: true,
          signal: true,
          zoomOut: true,
          history: true,
        },
        profileLoaded: true,
        trackedAssetId: 'bitcoin',
      }),
    );
    expect(picked.profileLoaded).toBe(true);
    expect(picked.severity).toBe('mild');
    expect(picked.trackedAssetId).toBe('bitcoin');
  });
});
