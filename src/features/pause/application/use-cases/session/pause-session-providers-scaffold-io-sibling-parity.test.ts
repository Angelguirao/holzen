import { describe, expect, it } from 'vitest';

import { pickPauseHolzenProvidersSlice } from '@/features/pause/presentation/session/pause-session-providers-io';
import * as providersIo from '@/features/pause/presentation/session/pause-session-providers-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import * as scaffoldIo from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';

/**
 * Application sibling parity: providers-io vs scaffold-io (parity with presentation
 * `pause-session-providers-scaffold-io-sibling-parity.test.ts` and flow umbrellas
 * `pause-session-providers-scaffold-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-session-providers-io-parity.test.ts` ↔
 * `pause-session-scaffold-io-parity.test.ts`.
 */
describe('pause-session-providers-io ↔ pause-session-scaffold-io sibling parity (application)', () => {
  it('providers-io and scaffold-io are distinct presentation I/O anchors', () => {
    expect(typeof pickPauseHolzenProvidersSlice).toBe('function');
    expect(typeof buildPauseSessionPersistSnapshot).toBe('function');
    expect(typeof computePauseStorageRitualSyncPatch).toBe('function');
    expect(typeof buildPauseSessionScaffoldRitualDerived).toBe('function');
    expect(typeof hasPersistablePauseSessionAnchor).toBe('function');

    expect('pickPauseHolzenProvidersSlice' in scaffoldIo).toBe(false);
    expect('buildPauseSessionPersistSnapshot' in providersIo).toBe(false);
    expect('computePauseStorageRitualSyncPatch' in providersIo).toBe(false);
    expect('buildPauseSessionScaffoldRitualDerived' in providersIo).toBe(false);
    expect('hasPersistablePauseSessionAnchor' in providersIo).toBe(false);
  });

  it('providers-io Holzen slice picker stays off scaffold persist/sync/derived helpers', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionPersistSnapshot);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseStorageRitualSyncPatch);
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(pickPauseHolzenProvidersSlice).not.toBe(hasPersistablePauseSessionAnchor);
  });

  it('scaffold-io exports stay off Holzen provider slice picker', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseStorageRitualSyncPatch).not.toBe(pickPauseHolzenProvidersSlice);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(pickPauseHolzenProvidersSlice);
    expect(hasPersistablePauseSessionAnchor).not.toBe(pickPauseHolzenProvidersSlice);
  });
});
