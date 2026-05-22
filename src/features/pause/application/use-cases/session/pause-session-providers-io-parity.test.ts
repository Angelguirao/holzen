import { describe, expect, it } from 'vitest';

import { pickPauseHolzenProvidersSlice as pickSliceDirect } from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
import { pickPauseHolzenProvidersSlice } from '@/features/pause/application/use-cases/session/pause-session-providers-flow';
import {
  pickPauseHolzenProvidersSlice as pickSliceFromProvidersIo,
} from '@/features/pause/presentation/session/pause-session-providers-io';

describe('pause-session-providers-io parity', () => {
  it('presentation I/O provider picker matches pause-session-providers-flow CI umbrella', () => {
    expect(pickPauseHolzenProvidersSlice).toBe(pickSliceFromProvidersIo);
  });

  it('providers-flow CI umbrella composes the same leaf module as presentation I/O', () => {
    expect(pickPauseHolzenProvidersSlice).toBe(pickSliceDirect);
  });
});
