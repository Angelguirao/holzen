import { describe, expect, it } from 'vitest';
import { resolveFrameHaikuDisplayBody } from '@/screens/pause/lib/resolve-frame-haiku-display-body';

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

  it('returns empty while idle without artifact', () => {
    expect(
      resolveFrameHaikuDisplayBody({
        artifactHaiku: '',
        haikuFetch: 'idle',
        reflectionMessage: 'text',
      }),
    ).toBe('');
  });
});
