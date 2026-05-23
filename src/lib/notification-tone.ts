/**
 * Holzen notification tone.
 * Uses Web Audio API to generate a warm, bowl-like chime.
 * No external API dependency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export async function playNotificationTone() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;

    // Fundamental tone (singing bowl ~528Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);

    // Gentle harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1056, now); // octave above

    // Gain envelopes
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2);
    osc2.stop(now + 1.5);
  } catch {
    // Silently fail — autoplay may be blocked
  }
}

/**
 * Deep singing-bowl tone for block discovery in the void.
 * Lower frequency, longer sustain — reverent and meditative.
 */
export async function playBlockDiscoveryTone() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;

    // Deep fundamental (~174Hz — a grounding, resonant frequency)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(174, now);

    // Warm overtone (~348Hz — octave)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(348, now);

    // Shimmering high partial (~528Hz — subtle presence)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(528, now);

    // Gain envelopes — slow attack, very long decay
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 5);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.07, now + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 4);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.03, now + 0.6);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 3);

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);
    osc3.connect(gain3).connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 5.5);
    osc2.stop(now + 4.5);
    osc3.stop(now + 3.5);
  } catch {
    // Silently fail — autoplay may be blocked
  }
}

/** No-op kept for API compatibility */
export function prefetchNotificationTone() {}

/**
 * Ambient drone for the void — barely audible low-frequency hum.
 * Two detuned sine waves create a slow beating/phasing effect.
 * Returns a stop function that fades out gracefully.
 */
export function startAmbientDrone(): () => void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // Two slightly detuned low sines — creates organic beating
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, now); // A1

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55.3, now); // slightly sharp — ~3s beat cycle

    // Sub-bass layer
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(110, now); // A2 octave

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    // Very slow fade in over 8 seconds to barely audible
    masterGain.gain.linearRampToValueAtTime(0.035, now + 8);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.012, now + 10);

    osc1.connect(masterGain).connect(ctx.destination);
    osc2.connect(masterGain);
    osc3.connect(gain3).connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    let stopped = false;

    return () => {
      if (stopped) return;
      stopped = true;
      const t = ctx.currentTime;
      // Graceful 3-second fade out
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(0, t + 3);
      gain3.gain.cancelScheduledValues(t);
      gain3.gain.setValueAtTime(gain3.gain.value, t);
      gain3.gain.linearRampToValueAtTime(0, t + 3);
      // Clean up after fade
      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        osc3.stop();
      }, 3500);
    };
  } catch {
    return () => {};
  }
}
