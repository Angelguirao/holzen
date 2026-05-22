import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience as startDirect,
  stopPauseReflectFrameFocusAmbience as stopDirect,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import {
  startPauseReflectFrameFocusAmbience as startFromAmbienceIo,
  stopPauseReflectFrameFocusAmbience as stopFromAmbienceIo,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';

describe('pause-reflect-ambience-io parity', () => {
  it('presentation I/O frame-focus exports match ambience CI umbrella', () => {
    expect(startPauseReflectFrameFocusAmbience).toBe(startFromAmbienceIo);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopFromAmbienceIo);
  });

  it('ambience CI umbrella composes domain reflect-frame-focus-ambience leaf as presentation I/O', () => {
    expect(startPauseReflectFrameFocusAmbience).toBe(startDirect);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopDirect);
  });
});
