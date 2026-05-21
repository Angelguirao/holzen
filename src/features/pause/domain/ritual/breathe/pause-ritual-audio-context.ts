/**
 * Shared Web Audio singleton for pause ritual cues and reflect/frame ambience.
 */

let ctxSingleton: AudioContext | null = null;

export function getPauseRitualAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctxSingleton) return ctxSingleton;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctxSingleton = new AC();
    return ctxSingleton;
  } catch {
    return null;
  }
}

/** Call from user gestures (Begin breathing, unmute) so Safari allows playback. */
export function resumePauseAudioContext(): Promise<void> {
  const ctx = getPauseRitualAudioContext();
  if (!ctx) return Promise.resolve();
  if (ctx.state === 'suspended') return ctx.resume().then(() => undefined);
  return Promise.resolve();
}

export function runPauseRitualAudioWhenReady(run: (ctx: AudioContext) => void): void {
  const ctx = getPauseRitualAudioContext();
  if (!ctx) return;
  void ctx.resume().then(() => {
    run(ctx);
  });
}
