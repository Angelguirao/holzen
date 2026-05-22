import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience as startPauseReflectFrameFocusAmbienceDirect,
  stopPauseReflectFrameFocusAmbience as stopPauseReflectFrameFocusAmbienceDirect,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';

describe('pause-reflect-ambience-io re-exports', () => {
  it('re-exports frame-focus ambience helpers from domain ritual/breathe leaf module', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(startPauseReflectFrameFocusAmbience).toBe(startPauseReflectFrameFocusAmbienceDirect);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopPauseReflectFrameFocusAmbienceDirect);
  });
});
