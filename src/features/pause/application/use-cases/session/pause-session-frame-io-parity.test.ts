import { describe, expect, it } from 'vitest';

import { initialFrameDoneFromRestored as initialFrameDoneDirect } from '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state';
import { initialFrameDoneFromRestored } from './pause-session-frame-flow';
import { initialFrameDoneFromRestored as initialFrameDoneFromFrameIo } from '@/features/pause/presentation/session/pause-session-frame-io';

/**
 * Application frame I/O parity (colocated beside `pause-session-frame-flow.ts`).
 * Presentation mirror: `presentation/session/pause-session-frame-io-parity.test.ts`.
 * Imports frame-flow CI umbrella for `.toBe` identity pins only — production frame I/O keeps
 * `restored-frame-ritual-state` leaf import.
 * Sibling pins: `pause-session-ritual-restore-frame-io-sibling-parity.test.ts` ↔ `pause-session-ritual-restore-io-parity.test.ts`.
 */
describe('pause-session-frame-io parity (application)', () => {
  it('presentation frame I/O matches session frame-flow CI umbrella', () => {
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneFromFrameIo);
  });

  it('frame-flow CI umbrella composes the same ritual/frame leaf as presentation I/O', () => {
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneDirect);
    expect(initialFrameDoneFromFrameIo).toBe(initialFrameDoneDirect);
  });
});
