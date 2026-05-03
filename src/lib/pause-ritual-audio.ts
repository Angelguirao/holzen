/**
 * Lightweight Web Audio cues for pause breathing (phase ticks + pattern-complete “bowl”).
 * Respects mute (header) and prefers-reduced-motion (no audio).
 */

type CueOptions = {
  muted: boolean;
  prefersReducedMotion: boolean;
};

let ctxSingleton: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctxSingleton) return ctxSingleton;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctxSingleton = new AC();
    return ctxSingleton;
  } catch {
    return null;
  }
}

/** Call from user gestures (Begin breathing, unmute) so Safari allows playback. */
export function resumePauseAudioContext(): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return Promise.resolve();
  if (ctx.state === 'suspended') return ctx.resume().then(() => undefined);
  return Promise.resolve();
}

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

function runWhenReady(run: (ctx: AudioContext) => void): void {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume().then(() => {
    run(ctx);
  });
}

/** Short tick at inhale/exhale transitions during the timed loop. */
export function playPauseBreathPhaseCue(opts: CueOptions): void {
  if (opts.muted || opts.prefersReducedMotion) return;
  runWhenReady((ctx) => {
    const t = ctx.currentTime;
    scheduleSineTone(ctx, 720, t, 0.07, 0.035);
  });
}

/** Softer two-tone swell when a breathing pattern finishes (before interstitial). */
export function playPauseBreathPatternCompleteCue(opts: CueOptions): void {
  if (opts.muted || opts.prefersReducedMotion) return;
  runWhenReady((ctx) => {
    const t = ctx.currentTime;
    scheduleSineTone(ctx, 196 * 2, t, 2.4, 0.07);
    scheduleSineTone(ctx, 196 * 2.67, t + 0.04, 2.0, 0.045);
  });
}
