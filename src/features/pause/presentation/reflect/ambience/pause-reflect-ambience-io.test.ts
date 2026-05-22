import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience as startDirect,
  stopPauseReflectFrameFocusAmbience as stopDirect,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';

describe('pause-reflect-ambience-io', () => {
  it('re-exports domain frame-focus ambience helpers with identity bindings', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');
    expect(startPauseReflectFrameFocusAmbience).toBe(startDirect);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopDirect);
  });
});
