import { describe, expect, it } from 'vitest';

import {
  pickPauseHolzenProvidersSlice,
  type PauseHolzenProvidersSlice,
  type PickPauseHolzenProvidersSliceSource,
} from './pause-session-providers-flow';
import {
  pickPauseHolzenProvidersSlice as pickDirect,
  type PauseHolzenProvidersSlice as SliceDirect,
  type PickPauseHolzenProvidersSliceSource as SourceDirect,
} from './pause-holzen-providers-slice';
import { computePauseSessionHydration } from './pause-session-shell-flow';
import { buildPauseSessionPersistSnapshot } from './pause-session-scaffold-flow';

describe('pause-session-providers-flow', () => {
  it('re-exports Holzen provider slice picker from pause-holzen-providers-slice', () => {
    const dismissMessage = async () => {};
    const resyncOpenPauseFromDb = () => {};
    const source: PickPauseHolzenProvidersSliceSource = {
      mantra: 'breathe',
      dismissMessage,
      message: null,
      context: null,
      companions: {},
      lastPauseInstanceId: null,
      companionPrefs: {
        breathing: true,
        haiku: false,
        grounding: false,
        signal: false,
        zoomOut: false,
        history: false,
      },
      severity: 'low',
      profileLoaded: false,
      resyncOpenPauseFromDb,
      btcData: null,
      trackedAssetId: 'bitcoin',
    };

    const viaFlow: PauseHolzenProvidersSlice = pickPauseHolzenProvidersSlice(source);
    const direct: SliceDirect = pickDirect(source as SourceDirect);

    expect(viaFlow.mantra).toBe('breathe');
    expect(viaFlow).toEqual(direct);
    expect(pickPauseHolzenProvidersSlice).toBe(pickDirect);
  });

  it('sibling cluster: shell-flow exports stay distinct from providers umbrella export', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionHydration);
    // Full cross-umbrella pins: `pause-session-providers-shell-flow-sibling-parity.test.ts`.
  });

  it('sibling cluster: scaffold-flow exports stay distinct from providers umbrella export', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionPersistSnapshot);
    // Full cross-umbrella pins: `pause-session-providers-scaffold-flow-sibling-parity.test.ts`.
  });
});
