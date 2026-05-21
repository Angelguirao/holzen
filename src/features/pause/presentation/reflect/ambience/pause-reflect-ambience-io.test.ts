import { describe, expect, it } from 'vitest';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';

describe('pause-reflect-ambience-io', () => {
  it('re-exports frame-focus ambience helpers for presentation conductors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');
  });
});
