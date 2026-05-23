import { describe, expect, it } from 'vitest';

import { pickPauseHolzenProvidersSlice } from './pause-session-providers-flow';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './pause-session-scaffold-flow';
import * as providersFlow from './pause-session-providers-flow';
import * as scaffoldFlow from './pause-session-scaffold-flow';

describe('pause-session-providers-flow ↔ pause-session-scaffold-flow sibling parity', () => {
  it('providers-flow and scaffold-flow are distinct sibling CI anchors', () => {
    expect(typeof pickPauseHolzenProvidersSlice).toBe('function');
    expect(typeof buildPauseSessionPersistSnapshot).toBe('function');
    expect(typeof computePauseStorageRitualSyncPatch).toBe('function');
    expect(typeof buildPauseSessionScaffoldRitualDerived).toBe('function');
    expect(typeof hasPersistablePauseSessionAnchor).toBe('function');

    expect('pickPauseHolzenProvidersSlice' in scaffoldFlow).toBe(false);
    expect('buildPauseSessionPersistSnapshot' in providersFlow).toBe(false);
    expect('computePauseStorageRitualSyncPatch' in providersFlow).toBe(false);
    expect('buildPauseSessionScaffoldRitualDerived' in providersFlow).toBe(false);
    expect('hasPersistablePauseSessionAnchor' in providersFlow).toBe(false);
  });

  it('providers umbrella export stays off scaffold persist/sync/derived helpers', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionPersistSnapshot);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseStorageRitualSyncPatch);
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(pickPauseHolzenProvidersSlice).not.toBe(hasPersistablePauseSessionAnchor);
  });

  it('scaffold umbrella exports stay off Holzen provider slice picker', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseStorageRitualSyncPatch).not.toBe(pickPauseHolzenProvidersSlice);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(pickPauseHolzenProvidersSlice);
    expect(hasPersistablePauseSessionAnchor).not.toBe(pickPauseHolzenProvidersSlice);
  });
});
