import { describe, expect, it } from 'vitest';
import { normalizeSignalKeyIdeas, normalizeSignalPayload } from './signal-payload';

describe('normalizeSignalKeyIdeas', () => {
  it('uses model keyIdeas when at least two valid bullets', () => {
    const ideas = normalizeSignalKeyIdeas({
      body: 'Long body that would otherwise be split.',
      keyIdeas: [' First idea here ', 'Second idea here', 'x'],
    });
    expect(ideas).toEqual(['First idea here', 'Second idea here']);
  });

  it('derives from body sentences when keyIdeas missing', () => {
    const ideas = normalizeSignalKeyIdeas({
      body: 'Bitcoin teaches patience across decades. Sound money rewards those who wait. Holding is a skill.',
    });
    expect(ideas.length).toBeGreaterThanOrEqual(2);
  });
});

describe('normalizeSignalPayload', () => {
  it('returns null without source', () => {
    expect(normalizeSignalPayload({ title: 'T', body: 'B' })).toBeNull();
  });

  it('attaches normalized keyIdeas', () => {
    const p = normalizeSignalPayload({
      title: 'T',
      body: 'One sentence here. Another sentence there.',
      source: 'Author',
      url: 'https://example.com',
      keyIdeas: ['Idea A is meaningful', 'Idea B is meaningful'],
    });
    expect(p?.keyIdeas).toEqual(['Idea A is meaningful', 'Idea B is meaningful']);
  });
});
