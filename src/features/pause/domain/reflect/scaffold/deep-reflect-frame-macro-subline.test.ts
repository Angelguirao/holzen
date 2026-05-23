import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { deepReflectOrFrameMacroSubline } from './deep-reflect-frame-macro-subline';

const t = vi.fn(
  (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
) as unknown as TFunction;

describe('deepReflectOrFrameMacroSubline', () => {
  it('returns reflect duration hint on reflect step', () => {
    expect(deepReflectOrFrameMacroSubline('reflect', t)).toBe('~ 3 min');
  });

  it('returns frame subtitle on frame step', () => {
    expect(deepReflectOrFrameMacroSubline('frame', t)).toBe('Take your time');
  });

  it('returns undefined for other steps', () => {
    expect(deepReflectOrFrameMacroSubline('feel', t)).toBeUndefined();
    expect(deepReflectOrFrameMacroSubline('decide', t)).toBeUndefined();
  });
});
