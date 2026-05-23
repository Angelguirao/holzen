import { describe, expect, it } from 'vitest';

import {
  computePauseSessionHydration,
  computePauseSessionResolved,
  isPauseSessionHeaderBackVisible,
} from './pause-session-shell-flow';
import { pickPauseHolzenProvidersSlice } from './pause-session-providers-flow';
import * as providersFlow from './pause-session-providers-flow';
import * as shellFlow from './pause-session-shell-flow';

describe('pause-session-providers-flow ↔ pause-session-shell-flow sibling parity', () => {
  it('providers-flow and shell-flow are distinct sibling CI anchors', () => {
    expect(typeof pickPauseHolzenProvidersSlice).toBe('function');
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(typeof isPauseSessionHeaderBackVisible).toBe('function');

    expect('pickPauseHolzenProvidersSlice' in shellFlow).toBe(false);
    expect('computePauseSessionHydration' in providersFlow).toBe(false);
    expect('computePauseSessionResolved' in providersFlow).toBe(false);
    expect('isPauseSessionHeaderBackVisible' in providersFlow).toBe(false);
  });

  it('providers umbrella export stays off shell hydration and header-back helpers', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionHydration);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionResolved);
    expect(pickPauseHolzenProvidersSlice).not.toBe(isPauseSessionHeaderBackVisible);
  });

  it('shell umbrella exports stay off Holzen provider slice picker', () => {
    expect(computePauseSessionHydration).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseSessionResolved).not.toBe(pickPauseHolzenProvidersSlice);
    expect(isPauseSessionHeaderBackVisible).not.toBe(pickPauseHolzenProvidersSlice);
  });
});
