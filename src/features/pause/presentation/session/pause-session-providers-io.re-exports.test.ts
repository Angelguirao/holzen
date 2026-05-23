import { describe, expect, it } from 'vitest';

import { pickPauseHolzenProvidersSlice as pickSliceDirect } from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
import { pickPauseHolzenProvidersSlice as pickSliceFromProvidersFlow } from '@/features/pause/application/use-cases/session/pause-session-providers-flow';

import {
  buildPauseSessionPersistSnapshot as buildPersistFromScaffoldIo,
  hasPersistablePauseSessionAnchor as hasAnchorFromScaffoldIo,
} from './scaffold/pause-session-scaffold-io';
import { pickPauseHolzenProvidersSlice } from './pause-session-providers-io';

describe('pause-session-providers-io re-exports', () => {
  it('re-exports pickPauseHolzenProvidersSlice from pause-holzen-providers-slice leaf module', () => {
    expect(typeof pickPauseHolzenProvidersSlice).toBe('function');
    expect(pickPauseHolzenProvidersSlice).toBe(pickSliceDirect);
  });

  it('presentation I/O bindings match pause-session-providers-flow CI anchor (leaf parity)', () => {
    expect(pickPauseHolzenProvidersSlice).toBe(pickSliceFromProvidersFlow);
  });

  it('sibling cluster: scaffold-io exports stay distinct from providers-io export', () => {
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPersistFromScaffoldIo);
    expect(pickPauseHolzenProvidersSlice).not.toBe(hasAnchorFromScaffoldIo);
  });
});
