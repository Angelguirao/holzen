import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './scaffold/pause-session-scaffold-io';
import * as handlersIo from './pause-session-step-handlers-io';
import * as scaffoldIo from './scaffold/pause-session-scaffold-io';

/**
 * Presentation sibling parity: scaffold-io vs step-handlers-io (parity with
 * `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts` and
 * `pause-session-shell-scaffold-io-sibling-parity.test.ts`). Persist/sync/derived
 * scaffold exports stay distinct from Framer step bundle builders.
 */
describe('pause-session-scaffold-io ↔ pause-session-step-handlers-io sibling parity', () => {
  it('scaffold-io and step-handlers-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildPauseSessionPersistSnapshot).toBe('function');
    expect(typeof computePauseStorageRitualSyncPatch).toBe('function');
    expect(typeof buildPauseSessionScaffoldRitualDerived).toBe('function');
    expect(typeof hasPersistablePauseSessionAnchor).toBe('function');
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');

    expect('buildPauseSessionPersistSnapshot' in handlersIo).toBe(false);
    expect('computePauseStorageRitualSyncPatch' in handlersIo).toBe(false);
    expect('buildPauseSessionScaffoldRitualDerived' in handlersIo).toBe(false);
    expect('hasPersistablePauseSessionAnchor' in handlersIo).toBe(false);
    expect('buildPauseSessionStepShellBundle' in scaffoldIo).toBe(false);
    expect('buildPauseSessionStepRitualBundle' in scaffoldIo).toBe(false);
  });

  it('scaffold-io exports stay off step bundle builders', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(buildPauseSessionStepShellBundle);
    expect(computePauseStorageRitualSyncPatch).not.toBe(buildPauseSessionStepRitualBundle);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(buildPauseSessionStepShellBundle);
    expect(hasPersistablePauseSessionAnchor).not.toBe(buildPauseSessionStepRitualBundle);
    expect(buildPauseSessionPersistSnapshot).not.toBe(buildPauseSessionStepRitualBundle);
    expect(computePauseStorageRitualSyncPatch).not.toBe(buildPauseSessionStepShellBundle);
  });

  it('step-handlers-io exports stay off scaffold persist/sync/derived helpers', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionPersistSnapshot);
    expect(buildPauseSessionStepRitualBundle).not.toBe(computePauseStorageRitualSyncPatch);
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(buildPauseSessionStepRitualBundle).not.toBe(hasPersistablePauseSessionAnchor);
    expect(buildPauseSessionStepShellBundle).not.toBe(hasPersistablePauseSessionAnchor);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionPersistSnapshot);
  });
});
