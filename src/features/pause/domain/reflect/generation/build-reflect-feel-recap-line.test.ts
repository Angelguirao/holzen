import { describe, expect, it } from 'vitest';
import { buildReflectFeelRecapLine } from './build-reflect-feel-recap-line';

const t = ((_key: string, opts?: { defaultValue?: string; mood?: string; intensity?: number; tile?: string }) => {
  if (opts?.defaultValue?.includes('{{mood}}')) {
    return `You said: ${opts.mood} (${opts.intensity}/5)`;
  }
  if (opts?.defaultValue?.includes('{{tile}}')) {
    return `“${opts.tile}”`;
  }
  return opts?.defaultValue ?? _key;
}) as import('i18next').TFunction;

describe('buildReflectFeelRecapLine', () => {
  it('returns null without mood', () => {
    expect(buildReflectFeelRecapLine(undefined, t)).toBeNull();
  });

  it('includes mood and intensity', () => {
    expect(
      buildReflectFeelRecapLine({ mood: 'fearful', intensity: 4 }, t),
    ).toBe('You said: Fearful (4/5)');
  });

  it('appends tile label when present', () => {
    expect(
      buildReflectFeelRecapLine({ mood: 'fearful', intensity: 4, tileLabel: 'Worried' }, t),
    ).toContain('Worried');
  });
});
