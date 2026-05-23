import { describe, expect, it } from 'vitest';
import {
  reflectionTextMessageFromArtifactRows,
  reflectionTextMessageFromContent,
} from './reflection-text-from-artifact-rows';

describe('reflectionTextMessageFromContent', () => {
  it('returns trimmed message when present', () => {
    expect(reflectionTextMessageFromContent({ message: '  breathe  ' })).toBe('breathe');
  });

  it('returns null for empty or missing message', () => {
    expect(reflectionTextMessageFromContent({ message: '   ' })).toBeNull();
    expect(reflectionTextMessageFromContent({})).toBeNull();
    expect(reflectionTextMessageFromContent(null)).toBeNull();
  });
});

describe('reflectionTextMessageFromArtifactRows', () => {
  it('returns first reflection_text message', () => {
    expect(
      reflectionTextMessageFromArtifactRows([
        { kind: 'haiku', content: { message: 'h' } },
        { kind: 'reflection_text', content: { message: 'reflect' } },
      ]),
    ).toBe('reflect');
  });

  it('returns null when no reflection_text row', () => {
    expect(reflectionTextMessageFromArtifactRows([{ kind: 'haiku', content: { message: 'h' } }])).toBeNull();
  });
});
