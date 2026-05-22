import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  pauseReflectGeneration,
  runReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';

describe('pause-reflect-ambience-io', () => {
  it('re-exports domain frame-focus ambience helpers for presentation conductors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');
  });

  it('sibling cluster: ambience-io exports stay distinct from generation-io holzen-reflect surface', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseReflectGeneration);
    // Full cross-I/O pins: `pause-reflect-ambience-generation-io-sibling-parity.test.ts`.
  });
});
