import { describe, expect, it } from 'vitest';
import {
  buildPauseSessionMountLogParams,
  coalescePauseSessionShellViewModel,
  computePauseHeaderBackIntent,
  computePauseSessionHydration,
  computePauseSessionResolved,
  hasPersistedPauseSessionPayload,
  isPauseSessionHeaderBackVisible,
  isPauseSessionWaitingForInstanceFetch,
} from './pause-session-shell-io';
import {
  buildPauseSessionPersistSnapshot,
  computePauseStorageRitualSyncPatch,
} from './scaffold/pause-session-scaffold-io';
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
      resyncOpenPauseFromDb: () => {},
      marketData: null,
      trackedAssetId: 'bitcoin',
    });

    expect(slice.mantra).toBe('');
    expect(slice.message).toBe('Take a breath.');
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-shell-io.test.ts` and `scaffold/pause-session-scaffold-io.test.ts`.
   * Dedicated sibling files: `pause-session-providers-shell-io-sibling-parity.test.ts`,
   * `pause-session-providers-scaffold-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: shell-io exports stay distinct from providers-io Holzen slice picker', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionHydration);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionResolved);
    expect(pickPauseHolzenProvidersSlice).not.toBe(isPauseSessionHeaderBackVisible);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseHeaderBackIntent);
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionMountLogParams);
    expect(pickPauseHolzenProvidersSlice).not.toBe(coalescePauseSessionShellViewModel);
    expect(pickPauseHolzenProvidersSlice).not.toBe(hasPersistedPauseSessionPayload);
    expect(pickPauseHolzenProvidersSlice).not.toBe(isPauseSessionWaitingForInstanceFetch);
  });

  it('sibling cluster: scaffold-io exports stay distinct from providers-io', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionPersistSnapshot);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseStorageRitualSyncPatch);
  });
});
