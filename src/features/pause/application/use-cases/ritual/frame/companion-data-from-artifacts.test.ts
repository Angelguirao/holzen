import { describe, expect, it } from 'vitest';
import { companionDataFromArtifacts } from './companion-data-from-artifacts';

describe('companionDataFromArtifacts', () => {
  it('returns haiku only and ignores ground_nudge rows', () => {
    expect(
      companionDataFromArtifacts([
        { kind: 'haiku', content: { haiku: 'a / b / c' } },
        { kind: 'ground_nudge', content: { title: 'T', body: 'B' } },
      ]),
    ).toEqual({ haiku: 'a / b / c' });
  });
});
