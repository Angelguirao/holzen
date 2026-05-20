/**
 * Soft continuous low-frequency bed for Reflect + Frame when ritual sound is on.
 * Shares the pause ritual `AudioContext` with breathing phase cues.
 */

import { runPauseRitualAudioWhenReady } from '@/features/pause/application/use-cases/breathing/pause-ritual-audio-context';

type AmbienceRuntime = {
  oscillators: OscillatorNode[];
  masterGain: GainNode;
};

let reflectFrameAmbience: AmbienceRuntime | null = null;

function teardownReflectFrameAmbienceImmediate(): void {
  if (!reflectFrameAmbience) return;
  const rt = reflectFrameAmbience;
  reflectFrameAmbience = null;
  try {
    rt.masterGain.disconnect();
  } catch {
    /* already disconnected */
  }
  for (const o of rt.oscillators) {
    try {
      o.stop();
      o.disconnect();
    } catch {
      /* already stopped */
    }
  }
}

/** Stop the Reflect / Frame focus bed (e.g. step change, unmount, mute). */
export function stopPauseReflectFrameFocusAmbience(): void {
  teardownReflectFrameAmbienceImmediate();
}

/**
 * Starts a very low, slow-rising sine stack for Reflect + Frame (deep focus bed).
 * `shouldContinue` is re-checked after `AudioContext` resume so mute / step changes win over async resume.
 */
export function startPauseReflectFrameFocusAmbience(shouldContinue: () => boolean): void {
  if (!shouldContinue()) return;
  teardownReflectFrameAmbienceImmediate();
  runPauseRitualAudioWhenReady((ctx) => {
    if (!shouldContinue()) return;
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(0.022, t + 3.2);

    const layers: { hz: number; level: number }[] = [
      { hz: 55, level: 0.52 },
      { hz: 82.41, level: 0.22 },
      { hz: 110, level: 0.18 },
    ];
    const oscillators: OscillatorNode[] = [];
    for (const { hz, level } of layers) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, t);
      const branch = ctx.createGain();
      branch.gain.setValueAtTime(level, t);
      osc.connect(branch);
      branch.connect(master);
      osc.start(t);
      oscillators.push(osc);
    }
    master.connect(ctx.destination);
    reflectFrameAmbience = { oscillators, masterGain: master };
  });
}
