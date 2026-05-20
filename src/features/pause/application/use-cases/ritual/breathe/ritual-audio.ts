/**
 * Lightweight Web Audio for pause rituals: breathing cues (phase ticks + pattern-complete “bowl”).
 * Reflect / Frame focus bed lives in `ritual/reflect/ambience/reflect-frame-focus-ambience.ts`.
 * Respects mute (header) and prefers-reduced-motion (no audio).
 */

import {
  resumePauseAudioContext,
  runPauseRitualAudioWhenReady,
} from './pause-ritual-audio-context';

export { resumePauseAudioContext };

type CueOptions = {
  muted: boolean;
  prefersReducedMotion: boolean;
};

function scheduleSineTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  durationSec: number,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);
  const end = startTime + durationSec;
  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.exponentialRampToValueAtTime(Math.max(peakGain, 0.0002), startTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(end + 0.02);
}

/** Short tick at inhale/exhale transitions during the timed loop. */
export function playPauseBreathPhaseCue(opts: CueOptions): void {
  if (opts.muted || opts.prefersReducedMotion) return;
  runPauseRitualAudioWhenReady((ctx) => {
    const t = ctx.currentTime;
    scheduleSineTone(ctx, 720, t, 0.07, 0.035);
  });
}

/** Softer two-tone swell when a breathing pattern finishes (before interstitial). */
export function playPauseBreathPatternCompleteCue(opts: CueOptions): void {
  if (opts.muted || opts.prefersReducedMotion) return;
  runPauseRitualAudioWhenReady((ctx) => {
    const t = ctx.currentTime;
    scheduleSineTone(ctx, 196 * 2, t, 2.4, 0.07);
    scheduleSineTone(ctx, 196 * 2.67, t + 0.04, 2.0, 0.045);
  });
}
