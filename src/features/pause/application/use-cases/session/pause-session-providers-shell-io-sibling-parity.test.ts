import { describe, expect, it } from 'vitest';

import { pickPauseHolzenProvidersSlice } from '@/features/pause/presentation/session/pause-session-providers-io';
import * as providersIo from '@/features/pause/presentation/session/pause-session-providers-io';
import {
  buildPauseSessionMountLogParams,
  coalescePauseSessionShellViewModel,
  computePauseHeaderBackIntent,
  computePauseSessionHydration,
  computePauseSessionResolved,
  hasPersistedPauseSessionPayload,
  isPauseSessionHeaderBackVisible,
  isPauseSessionWaitingForInstanceFetch,
} from '@/features/pause/presentation/session/pause-session-shell-io';
import * as shellIo from '@/features/pause/presentation/session/pause-session-shell-io';

/**
 * Application sibling parity: providers-io vs shell-io (parity with presentation
 * `pause-session-providers-shell-io-sibling-parity.test.ts` and flow umbrellas
 * `pause-session-providers-shell-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-session-providers-io-parity.test.ts` ↔
 * `pause-session-shell-io-parity.test.ts`.
 */
describe('pause-session-providers-io ↔ pause-session-shell-io sibling parity (application)', () => {
  it('providers-io and shell-io are distinct presentation I/O anchors', () => {
    expect(typeof pickPauseHolzenProvidersSlice).toBe('function');
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(typeof isPauseSessionHeaderBackVisible).toBe('function');
    expect(typeof computePauseHeaderBackIntent).toBe('function');
    expect(typeof buildPauseSessionMountLogParams).toBe('function');
    expect(typeof coalescePauseSessionShellViewModel).toBe('function');
    expect(typeof hasPersistedPauseSessionPayload).toBe('function');
    expect(typeof isPauseSessionWaitingForInstanceFetch).toBe('function');

    expect('pickPauseHolzenProvidersSlice' in shellIo).toBe(false);
    expect('computePauseSessionHydration' in providersIo).toBe(false);
    expect('computePauseSessionResolved' in providersIo).toBe(false);
    expect('isPauseSessionHeaderBackVisible' in providersIo).toBe(false);
    expect('computePauseHeaderBackIntent' in providersIo).toBe(false);
    expect('buildPauseSessionMountLogParams' in providersIo).toBe(false);
    expect('coalescePauseSessionShellViewModel' in providersIo).toBe(false);
    expect('hasPersistedPauseSessionPayload' in providersIo).toBe(false);
    expect('isPauseSessionWaitingForInstanceFetch' in providersIo).toBe(false);
  });

  it('providers-io Holzen slice picker stays off shell hydration and header-back helpers', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionHydration);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionResolved);
    expect(pickPauseHolzenProvidersSlice).not.toBe(isPauseSessionHeaderBackVisible);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseHeaderBackIntent);
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionMountLogParams);
    expect(pickPauseHolzenProvidersSlice).not.toBe(coalescePauseSessionShellViewModel);
    expect(pickPauseHolzenProvidersSlice).not.toBe(hasPersistedPauseSessionPayload);
    expect(pickPauseHolzenProvidersSlice).not.toBe(isPauseSessionWaitingForInstanceFetch);
  });

  it('shell-io exports stay off Holzen provider slice picker', () => {
    expect(computePauseSessionHydration).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseSessionResolved).not.toBe(pickPauseHolzenProvidersSlice);
    expect(isPauseSessionHeaderBackVisible).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseHeaderBackIntent).not.toBe(pickPauseHolzenProvidersSlice);
    expect(buildPauseSessionMountLogParams).not.toBe(pickPauseHolzenProvidersSlice);
    expect(coalescePauseSessionShellViewModel).not.toBe(pickPauseHolzenProvidersSlice);
    expect(hasPersistedPauseSessionPayload).not.toBe(pickPauseHolzenProvidersSlice);
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(pickPauseHolzenProvidersSlice);
  });
});
