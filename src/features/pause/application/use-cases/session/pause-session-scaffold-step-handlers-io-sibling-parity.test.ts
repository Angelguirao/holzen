import { describe, expect, it } from 'vitest';

import * as handlersIo from '@/features/pause/presentation/session/pause-session-step-handlers-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
import * as scaffoldIo from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';

/**
 * Application sibling parity: scaffold-io vs step-handlers-io (parity with
 * presentation `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-session-scaffold-io-parity.test.ts` ↔
 * `presentation/session/pause-session-step-handlers-io-parity.test.ts`.
 */
describe('pause-session-scaffold-io ↔ pause-session-step-handlers-io sibling parity (application)', () => {
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
