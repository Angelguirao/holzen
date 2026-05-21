import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './reflect-frame-focus-ambience';

describe('reflect-frame-focus-ambience', () => {
  const resume = vi.fn().mockResolvedValue(undefined);
  let connectCalls: number;

  beforeEach(() => {
    connectCalls = 0;
    vi.stubGlobal(
      'AudioContext',
      class MockAudioContext {
        state = 'running';
        currentTime = 0;
        destination = {} as AudioDestinationNode;
        resume = resume;
        createGain() {
          const gain = {
            gain: {
              setValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(() => {
              connectCalls += 1;
            }),
            disconnect: vi.fn(),
          };
          return gain as unknown as GainNode;
        }
        createOscillator() {
          const osc = {
            type: 'sine' as OscillatorType,
            frequency: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          };
          return osc as unknown as OscillatorNode;
        }
      },
    );
  });

  afterEach(() => {
    stopPauseReflectFrameFocusAmbience();
    vi.unstubAllGlobals();
  });

  it('does not connect oscillators when shouldContinue is false on post-resume check', async () => {
    let calls = 0;
    const shouldContinue = vi.fn(() => {
      calls += 1;
      return calls === 1;
    });

    startPauseReflectFrameFocusAmbience(shouldContinue);
    await Promise.resolve();
    await Promise.resolve();

    expect(connectCalls).toBe(0);
    expect(shouldContinue).toHaveBeenCalledTimes(2);
  });

  it('builds graph when shouldContinue stays true', async () => {
    const shouldContinue = vi.fn(() => true);
    startPauseReflectFrameFocusAmbience(shouldContinue);
    await Promise.resolve();
    await Promise.resolve();

    expect(connectCalls).toBeGreaterThanOrEqual(1);
  });
});
