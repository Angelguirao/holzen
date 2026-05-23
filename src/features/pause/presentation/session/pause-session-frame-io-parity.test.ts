import { describe, expect, it } from 'vitest';

import { initialFrameDoneFromRestored as initialFrameDoneDirect } from '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state';
import { initialFrameDoneFromRestored } from '@/features/pause/application/use-cases/session/pause-session-frame-flow';
import { initialFrameDoneFromRestored as initialFrameDoneFromFrameIo } from '@/features/pause/presentation/session/pause-session-frame-io';

/**
 * Presentation I/O parity (colocated beside `pause-session-frame-io.ts`).
 * Application mirror: `application/.../session/pause-session-frame-io-parity.test.ts`.
 * Imports `pause-session-frame-flow` CI umbrella for `.toBe` identity pins only — production frame I/O keeps `restored-frame-ritual-state` leaf import.
 * Sibling pins: `pause-session-ritual-restore-frame-io-sibling-parity.test.ts` ↔ `pause-session-ritual-restore-io-parity.test.ts`.
 */
describe('pause-session-frame-io parity', () => {
  it('presentation I/O frame exports match pause-session-frame-flow CI umbrella', () => {
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneFromFrameIo);
  });

  it('session-frame-flow CI umbrella composes the same leaf module as presentation I/O', () => {
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneDirect);
  });
});
