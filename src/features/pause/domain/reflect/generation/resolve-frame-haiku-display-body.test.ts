import { describe, expect, it } from 'vitest';
import { resolveFrameHaikuDisplayBody } from './resolve-frame-haiku-display-body';

describe('resolveFrameHaikuDisplayBody', () => {
  it('prefers artifact haiku when present', () => {
    expect(
      resolveFrameHaikuDisplayBody({
        artifactHaiku: '  breath line  ',
        haikuFetch: 'idle',
        reflectionMessage: 'reflection',
      }),
    ).toBe('breath line');
  });

  it('falls back to reflection after fetch completes', () => {
    expect(
      resolveFrameHaikuDisplayBody({
        artifactHaiku: null,
        haikuFetch: 'done',
        reflectionMessage: '  my reflection ',
      }),
    ).toBe('my reflection');
  });

  it('uses reflection while idle or loading when artifact is missing', () => {
    expect(
      resolveFrameHaikuDisplayBody({
        artifactHaiku: '',
        haikuFetch: 'idle',
        reflectionMessage: 'text',
      }),
    ).toBe('text');
    expect(
      resolveFrameHaikuDisplayBody({
        artifactHaiku: null,
        haikuFetch: 'loading',
        reflectionMessage: '  loading copy ',
      }),
    ).toBe('loading copy');
  });

  it('returns empty when artifact and reflection are both missing', () => {
    expect(
      resolveFrameHaikuDisplayBody({
        artifactHaiku: null,
        haikuFetch: 'done',
        reflectionMessage: '   ',
      }),
    ).toBe('');
  });
});
