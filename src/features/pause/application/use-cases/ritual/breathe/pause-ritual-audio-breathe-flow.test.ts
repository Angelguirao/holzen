import { describe, expect, it } from 'vitest';

import {
  playPauseBreathPatternCompleteCue as patternCompleteDirect,
  playPauseBreathPhaseCue as phaseCueDirect,
  resumePauseAudioContext as resumeContextDirect,
} from './ritual-audio';

import {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from './pause-ritual-audio-breathe-flow';

describe('pause-ritual-audio-breathe-flow', () => {
  it('re-exports ritual breathe Web Audio cues from ritual-audio leaf', () => {
    expect(typeof playPauseBreathPhaseCue).toBe('function');
    expect(typeof playPauseBreathPatternCompleteCue).toBe('function');
    expect(typeof resumePauseAudioContext).toBe('function');

    expect(playPauseBreathPhaseCue).toBe(phaseCueDirect);
    expect(playPauseBreathPatternCompleteCue).toBe(patternCompleteDirect);
    expect(resumePauseAudioContext).toBe(resumeContextDirect);
  });
});
