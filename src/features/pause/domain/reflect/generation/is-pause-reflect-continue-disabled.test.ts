import { describe, expect, it } from 'vitest';
import { isPauseReflectContinueDisabled } from './is-pause-reflect-continue-disabled';

describe('isPauseReflectContinueDisabled', () => {
  it('blocks when there is no reflection copy yet', () => {
    expect(
      isPauseReflectContinueDisabled({
        reflectionError: null,
        reflectionMessage: '  ',
      }),
    ).toBe(true);
  });

  it('allows continue when generation failed so the user can skip', () => {
    expect(
      isPauseReflectContinueDisabled({
        reflectionError: 'Reflection unavailable',
        reflectionMessage: '',
      }),
    ).toBe(false);
  });

  it('allows continue when reflection copy exists', () => {
    expect(
      isPauseReflectContinueDisabled({
        reflectionError: null,
        reflectionMessage: 'Breathe.',
      }),
    ).toBe(false);
  });
});
