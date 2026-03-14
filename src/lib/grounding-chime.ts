/**
 * Gentle grounding chime — warmer, softer than the notification tone.
 * Uses Web Audio API. No external dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export async function playGroundingChime() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;

    // Warm fundamental (~396Hz — G4, calming)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(396, now);

    // Soft fifth (~594Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(594, now);

    // Sub layer (~198Hz — octave below)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(198, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 3);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);
    osc3.connect(gain3).connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 3.5);
    osc2.stop(now + 3);
    osc3.stop(now + 4);
  } catch {
    // Silently fail — autoplay may be blocked
  }
}
